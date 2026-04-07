import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

function wsOrigins(): string[] {
  const fromEnv = process.env.ALLOWED_ORIGINS?.split(',').map((s) => s.trim()).filter(Boolean);
  if (fromEnv?.length) return fromEnv;
  return [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174',
  ];
}

@WebSocketGateway({
  cors: {
    origin: wsOrigins(),
    credentials: true,
  },
})
export class SocketsGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private logger: Logger = new Logger('SocketsGateway');

  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway Initialized');
  }

  handleConnection(client: Socket, ...args: any[]) {
    this.logger.log(`Client connected: ${client.id}`);

    client.on('join_room', (room: string) => {
      if (!room || typeof room !== 'string') return;
      client.join(room);
      this.logger.log(`Client ${client.id} joined room ${room}`);
    });
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join_exam_room')
  handleJoinExam(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { examId?: string; userId?: string; role?: string },
  ) {
    if (!data?.examId) return { ok: false };
    const room = `exam:${data.examId}`;
    client.join(room);
    this.logger.log(`Client ${client.id} joined ${room}`);
    return { ok: true, room };
  }

  @SubscribeMessage('leave_exam_room')
  handleLeaveExam(@ConnectedSocket() client: Socket, @MessageBody() data: { examId?: string }) {
    if (data?.examId) {
      client.leave(`exam:${data.examId}`);
    }
    return { ok: true };
  }

  /** Admin/teachers: user/role xonalari (keyinchalik target emit uchun). */
  @SubscribeMessage('join_app')
  handleJoinApp(@ConnectedSocket() client: Socket, @MessageBody() data: { userId?: string; role?: string }) {
    client.join('app');
    if (data?.userId) client.join(`user:${data.userId}`);
    if (data?.role) client.join(`role:${data.role}`);
    return { ok: true };
  }

  // --- Utility Methods to Dispatch Events --- //

  emitToRoom(room: string, event: string, payload: any) {
    this.server.to(room).emit(event, payload);
  }

  emitToAll(event: string, payload: any) {
    this.server.emit(event, payload);
  }

  /** Dashboard va ro‘yxatlar real-time yangilanishi. */
  emitDashboardRefresh(payload?: Record<string, unknown>) {
    this.server.emit('dashboard_refresh', payload ?? {});
  }
}
