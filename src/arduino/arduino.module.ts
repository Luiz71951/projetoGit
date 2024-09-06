import { Module } from '@nestjs/common';
import { ArduinoService } from './arduino.service';
import { ArduinoGateway } from './arduino.gateway';
import { SensoreController } from './arduino.controller';

@Module({
  exports: [ArduinoGateway],
  controllers: [SensoreController],
  providers: [ArduinoGateway, ArduinoService],
})
export class ArduinoModule { }
