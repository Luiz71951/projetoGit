import { IsString, IsNotEmpty, IsDate, IsEnum } from 'class-validator';

export class CreateAttendanceDto {


  @IsString()
  @IsNotEmpty()
  studentId: string; 
}
