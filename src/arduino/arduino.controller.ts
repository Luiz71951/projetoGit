import { Controller, Delete, Patch } from "@nestjs/common";
import { ArduinoGateway } from "./arduino.gateway";

@Controller('sensor')
export class SensoreController {

    constructor(private readonly arduinoGateway: ArduinoGateway) { }

    @Delete('database')
    resetSensorDataBase() {
        this.arduinoGateway.sendToArduino("5");
        setTimeout(() => {
            this.arduinoGateway.sendToArduino("SIM");
          }, 2000);
       
    }
    @Patch('reset')
    resetCommand() {
        this.arduinoGateway.sendToArduino("666");
       
    }


}