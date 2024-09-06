import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Student } from './entities/student.entity';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { ArduinoGateway } from '../arduino/arduino.gateway'; // O módulo WebSocket que controla o Arduino
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class StudentsService {
  constructor(
    @InjectRepository(Student)
    private readonly studentRepository: Repository<Student>,
    private readonly arduinoGateway: ArduinoGateway,  // Injeta o WebSocket Gateway do Arduino
    private readonly eventEmitter: EventEmitter2      // Usamos EventEmitter para comunicação interna
  ) { }

  async create(createStudentDto: CreateStudentDto): Promise<Student> {
    const lastStudent = await this.studentRepository.find();
    const lastFingerPrintNumber = (lastStudent.length + 1).toString() ?? "1";
    console.log(lastFingerPrintNumber, "lastFingerPrintNumber")
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

  async registerFingerprint(fingerPosition: string): Promise<string> {
    return new Promise((resolve, reject) => {
      this.arduinoGateway.sendToArduino('1');
      this.arduinoGateway.sendToArduino(fingerPosition);

      this.eventEmitter.once('fingerprint_registered', (fingerprintNumber: string) => {
        resolve(fingerprintNumber);
      });
      
      this.eventEmitter.once('erro_fingerprint_register', () => {
        reject(new BadRequestException('Erro ao registrar Digital'));
      });

      setTimeout(() => {
        reject(new BadRequestException('Fingerprint registration timed out'));
      }, 15000);
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

  async remove(id: string): Promise<void> {
    const result = await this.studentRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Student with ID ${id} not found`);
    }
  }
}
