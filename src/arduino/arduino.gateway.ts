import { WebSocketGateway, WebSocketServer, SubscribeMessage, OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { EventEmitter2 } from '@nestjs/event-emitter';

@WebSocketGateway({ cors: true })
export class ArduinoGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  constructor(private readonly eventEmitter: EventEmitter2) { }

  afterInit(server: Server) {
    console.log('WebSocket Server Initialized');
  }

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  sendToArduino(command: string) {
    const commandMessage = ['arduinoCommand', { message: command }];
    this.server.emit('arduinoCommand', commandMessage);
  }

  @SubscribeMessage('arduinoResponse')
  handleArduinoResponse(client: Socket, payload: any) {
    console.log(`Received response from Arduino: ${payload.response}`);
    if (payload.response.includes('Sucesso')) {
      const fingerprintNumber = extractFingerprintNumberFromPayload(payload.response); 
      this.eventEmitter.emit('fingerprint_registered', fingerprintNumber);
    }
    if (payload.response.includes('Digital encontrada')) {
      const fingerprintInfo = extractFingerprintInfo(payload.response); 
      this.eventEmitter.emit('fingerprint_info', fingerprintInfo);
    }
    if (payload.response.includes('Digital apagada com sucesso')) {
      this.eventEmitter.emit('fingerprint_deleted', {});
    }
    if (payload.response.includes('Digital não encontrada')) {
      this.eventEmitter.emit('fingerprint_not_found', {});
    }
    if (payload.response.includes('Erro')) {
      this.eventEmitter.emit('erro_fingerprint_register', {});
      this.eventEmitter.emit('erro_fingerprint', {});
      
    }
    if (payload.response.includes('Erro')) {
      this.eventEmitter.emit('erro_fingerprint_register', {});
    }
  }
}

function extractFingerprintNumberFromPayload(response: string): string {

  const match = response.match(/Posição: (\d+)/);
  return match ? match[1] : '0';
}

function extractFingerprintInfo(response: string): { position: number, confidence: number } | null {
  const positionMatch = response.match(/posição (\d+)/i);
  const confidenceMatch = response.match(/confiança de (\d+)/i);

  if (positionMatch && confidenceMatch) {
    return {
      position: parseInt(positionMatch[1], 10),
      confidence: parseInt(confidenceMatch[1], 10)
    };
  }

  return null;
}