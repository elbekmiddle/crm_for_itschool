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
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';
import { validate as uuidValidate } from 'uuid';
import { RedisService } from '../../infrastructure/redis/redis.service';

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

function extractAccessTokenFromCookie(raw?: string): string | null {
  if (!raw) return null;
  for (const part of raw.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const k = part.slice(0, idx).trim();
    const v = part.slice(idx + 1).trim();
    if (k === 'access_token') {
      try {
        return decodeURIComponent(v);
      } catch {
        return v;
      }
    }
  }
  return null;
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

  constructor(
    private readonly jwtService: JwtService,
    private readonly redisService: RedisService,
  ) {}

  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway Initialized');
  }

  async handleConnection(client: Socket) {
    const cookieHeader = client.handshake.headers?.cookie;
    let token = extractAccessTokenFromCookie(cookieHeader);
    if (!token && client.handshake.auth && typeof client.handshake.auth === 'object') {
      const a = client.handshake.auth as Record<string, unknown>;
      if (typeof a.token === 'string') token = a.token;
    }
    if (!token) {
      this.logger.warn(`Socket ${client.id}: access_token yo‘q — uzildi`);
      client.disconnect(true);
      return;
    }
    try {
      const payload = this.jwtService.verify<{ sub: string; role: string }>(token);
      const blacklisted = await this.redisService.get(`blacklist:${token}`);
      if (blacklisted) {
        client.disconnect(true);
        return;
      }
      (client.data as { user?: { sub: string; role: string } }).user = payload;
    } catch {
      this.logger.warn(`Socket ${client.id}: JWT yaroqsiz — uzildi`);
      client.disconnect(true);
      return;
    }

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
    if (!(client.data as { user?: unknown }).user) {
      return { ok: false, error: 'unauthorized' };
    }
    if (!data?.examId || !uuidValidate(data.examId)) {
      return { ok: false, error: 'invalid_exam_id' };
    }
    const room = `exam:${data.examId}`;
    client.join(room);
    this.logger.log(`Client ${client.id} joined ${room}`);
    return { ok: true, room };
  }

  @SubscribeMessage('leave_exam_room')
  handleLeaveExam(@ConnectedSocket() client: Socket, @MessageBody() data: { examId?: string }) {
    if (data?.examId && uuidValidate(data.examId)) {
      client.leave(`exam:${data.examId}`);
    }
    return { ok: true };
  }

  /** JWT dagi `sub` — yagona manba (client yuborgan userId ishonchli emas) */
  @SubscribeMessage('join_app')
  handleJoinApp(@ConnectedSocket() client: Socket, @MessageBody() data: { role?: string }) {
    const sub = (client.data as { user?: { sub?: string } }).user?.sub;
    if (!sub) {
      return { ok: false, error: 'unauthorized' };
    }
    client.join('app');
    client.join(`user:${sub}`);
    if (data?.role) client.join(`role:${data.role}`);
    return { ok: true };
  }

  emitToRoom(room: string, event: string, payload: any) {
    this.server.to(room).emit(event, payload);
  }

  emitToAll(event: string, payload: any) {
    this.server.emit(event, payload);
  }

  emitDashboardRefresh(payload?: Record<string, unknown>) {
    this.server.emit('dashboard_refresh', payload ?? {});
  }
}
