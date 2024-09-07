import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Attendance } from './entities/attendance.entity';
import { CreateAttendanceDto } from './dto/create-attendance.dto';
import { UpdateAttendanceDto } from './dto/update-attendance.dto';
import { ArduinoGateway } from 'src/arduino/arduino.gateway';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { StudentsService } from 'src/student/student.service';

@Injectable()
export class AttendanceService {
  constructor(
    @InjectRepository(Attendance)
    private readonly attendanceRepository: Repository<Attendance>,
    private readonly arduinoGateway: ArduinoGateway, 
    private readonly eventEmitter: EventEmitter2,
    private readonly studentsService: StudentsService,
  ) { }


  async register(): Promise<Attendance> {

    const fingerPrintBySensor: any = await this.checkFingerPrint();

    if (!fingerPrintBySensor) throw new BadRequestException('Digital não encontrada');

    if (fingerPrintBySensor?.confidence < 50) throw new BadRequestException('Nivel de confiança recebido está abaixo de 50. Por favor, tente novamente!');

    const studentFromFingerPrintSensor = await this.studentsService.findOneByFingerPrintPosition(fingerPrintBySensor?.position);

    const attendance = this.attendanceRepository.create({ student: { id: studentFromFingerPrintSensor.id } });
    return await this.attendanceRepository.save(attendance);
  }

  async checkFingerPrint() {
    return new Promise((resolve, reject) => {
      this.arduinoGateway.sendToArduino('2');

      // Inicia o setTimeout
      const timeout = setTimeout(() => {
        reject(new BadRequestException('Fingerprint registration timed out'));
        this.arduinoGateway.sendToArduino("666");
      }, 15000);

      // Quando fingerprint_info é emitido, resolvemos e limpamos o timeout
      this.eventEmitter.once('fingerprint_info', (fingerPrintInfo: { position: number, confidence: number }) => {
        clearTimeout(timeout); // Limpa o timeout antes de resolver
        resolve(fingerPrintInfo);
      });

      // Quando fingerprint_not_found é emitido, rejeitamos e limpamos o timeout
      this.eventEmitter.once('fingerprint_not_found', () => {
        clearTimeout(timeout); // Limpa o timeout antes de rejeitar
        reject(new BadRequestException('Digital não encontrada!'));
      });

      // Quando erro_fingerprint é emitido, rejeitamos e limpamos o timeout
      this.eventEmitter.once('erro_fingerprint', () => {
        clearTimeout(timeout); // Limpa o timeout antes de rejeitar
        reject(new BadRequestException('Ocorreu um erro interno. Por favor, tente novamente!'));
      });
    });
  }

  async findAll(): Promise<Attendance[]> {
    return await this.attendanceRepository.find({ relations: ['student'] });
  }

  async findOne(id: string): Promise<Attendance> {
    const attendance = await this.attendanceRepository.findOne({
      where: { id },
      relations: ['student'],
    });
    if (!attendance) {
      throw new NotFoundException(`Attendance record with ID ${id} not found`);
    }
    return attendance;
  }

  async update(id: string, updateAttendanceDto: UpdateAttendanceDto): Promise<Attendance> {
    const attendance = await this.attendanceRepository.preload({
      id,
      ...updateAttendanceDto,
    });
    if (!attendance) {
      throw new NotFoundException(`Attendance record with ID ${id} not found`);
    }
    return await this.attendanceRepository.save(attendance);
  }

  async remove(id: string): Promise<void> {
    const result = await this.attendanceRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Attendance record with ID ${id} not found`);
    }
  }
}
