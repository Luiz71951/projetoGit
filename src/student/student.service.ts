import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Student } from './entities/student.entity';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { ArduinoGateway } from '../arduino/arduino.gateway';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class StudentsService {
  constructor(
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,
    private readonly arduinoGateway: ArduinoGateway,
    private readonly eventEmitter: EventEmitter2
  ) {}

  async create(createStudentDto: CreateStudentDto): Promise<Student> {
    const lastStudent = await this.studentRepository.find();
    const lastFingerPrintNumber = (lastStudent.length + 1).toString() ?? "1";
    const fingerprintNumber = await this.registerFingerprint(lastFingerPrintNumber);

    if (!fingerprintNumber) {
      throw new BadRequestException('Fingerprint registration failed');
    }

    const student = this.studentRepository.create({
      ...createStudentDto,
      fingerprint: lastFingerPrintNumber,
    });

    return await this.studentRepository.save(student);
  }

  async registerFingerprint(fingerPosition: string, isToCountTimeout: boolean = true): Promise<string> {
    return new Promise((resolve, reject) => {
      this.arduinoGateway.sendToArduino('1');
      setTimeout(() => {
        this.arduinoGateway.sendToArduino(fingerPosition);
      }, 2000);

      const timeout = setTimeout(() => {
        reject(new BadRequestException('Fingerprint registration timed out'));
        this.arduinoGateway.sendToArduino("666");
      }, 15000);

      this.eventEmitter.once('fingerprint_registered', (fingerprintNumber: string) => {
        clearTimeout(timeout);
        resolve(fingerprintNumber);
      });

      this.eventEmitter.once('erro_fingerprint_register', () => {
        clearTimeout(timeout);
        reject(new BadRequestException('Erro ao registrar Digital'));
      });

      if (!isToCountTimeout) {
        clearTimeout(timeout);
      }
    });
  }

  async updateFingerprint(fingerPosition: string): Promise<string> {
    await this.findOneByFingerPrintPosition(fingerPosition);
    return new Promise((resolve, reject) => {
      this.arduinoGateway.sendToArduino('4');
      setTimeout(() => {
        this.arduinoGateway.sendToArduino(fingerPosition);
      }, 2000);

      const timeout = setTimeout(() => {
        reject(new Error('Fingerprint update timed out'));
        this.arduinoGateway.sendToArduino("666");
      }, 25000);

      this.eventEmitter.once('fingerprint_deleted', async (fingerprintNumber: string) => {
        clearTimeout(timeout);
        try {
          await this.registerFingerprint(fingerPosition, false);
          resolve("Digital Atualizada");
        } catch (error) {
          throw error;
        }
      });

      this.eventEmitter.once('erro_fingerprint_deleted', () => {
        clearTimeout(timeout);
        reject(new Error('Erro ao registrar Digital'));
      });
    });
  }

  async findAll(): Promise<Student[]> {
    return await this.studentRepository.find();
  }

  async findOne(id: string): Promise<Student> {
    const student = await this.studentRepository.findOneBy({ id });
    if (!student) {
      throw new NotFoundException(`Student with ID ${id} not found`);
    }
    return student;
  }

  async findOneByFingerPrintPosition(fingerprint: string): Promise<Student> {
    const student = await this.studentRepository.findOneBy({ fingerprint });
    if (!student) {
      throw new NotFoundException(`Student with fingerprint ${fingerprint} not found`);
    }
    return student;
  }

  async update(id: string, updateStudentDto: UpdateStudentDto): Promise<Student> {
    const student = await this.studentRepository.preload({
      id,
      ...updateStudentDto,
    });
    if (!student) {
      throw new NotFoundException(`Student with ID ${id} not found`);
    }
    return await this.studentRepository.save(student);
  }

  async updateUserFingerPrint(id: string, updateStudentDto: UpdateStudentDto): Promise<Student> {
    const student = await this.studentRepository.preload({
      id,
      ...updateStudentDto,
    });
    if (!student) {
      throw new NotFoundException(`Student with ID ${id} not found`);
    }
    return await this.studentRepository.save(student);
  }

  async remove(id: string): Promise<void> {
    const result = await this.studentRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Student with ID ${id} not found`);
    }
  }
}
