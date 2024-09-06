import { PartialType } from '@nestjs/mapped-types';
import { CreateArduinoDto } from './create-arduino.dto';

export class UpdateArduinoDto extends PartialType(CreateArduinoDto) {
  id: number;
}
