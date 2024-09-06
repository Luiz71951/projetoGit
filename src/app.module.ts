import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { configService } from '../config/config.service';
import { StudentsModule } from './student/student.module';
import { AttendanceModule } from './attendance/attendance.module';
import { ArduinoModule } from './arduino/arduino.module';
import { EventEmitterModule } from '@nestjs/event-emitter';

@Module({
  imports: [TypeOrmModule.forRoot(configService.getTypeOrmConfig()), EventEmitterModule.forRoot({
    ignoreErrors: true,
  }), StudentsModule, AttendanceModule, ArduinoModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
