import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SocketsGateway } from './sockets.gateway';

@Global()
@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET') || 'super_secret_jwt_key_here',
        signOptions: { expiresIn: config.get<string>('JWT_EXPIRES_IN') || '15m' },
      }),
    }),
  ],
  providers: [SocketsGateway],
  exports: [SocketsGateway],
})
export class SocketsModule {}
