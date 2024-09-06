import { Module } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { AttendanceController } from './attendance.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Attendance } from './entities/attendance.entity';
import { Student } from 'src/student/entities/student.entity';
import { ArduinoModule } from 'src/arduino/arduino.module';
import { StudentsModule } from 'src/student/student.module';

@Module({
  imports: [TypeOrmModule.forFeature([Attendance, Student]), StudentsModule, ArduinoModule],
  controllers: [AttendanceController],
  providers: [AttendanceService],
})
export class AttendanceModule {}
