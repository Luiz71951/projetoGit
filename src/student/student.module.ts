import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StudentsController } from './student.controller';
import { StudentsService } from './student.service';
import { Student } from './entities/student.entity';
import { ArduinoModule } from 'src/arduino/arduino.module';

@Module({
  imports: [TypeOrmModule.forFeature([Student]), ArduinoModule],
  controllers: [StudentsController],
  providers: [StudentsService],
  exports: [StudentsService],
})
export class StudentsModule {}
