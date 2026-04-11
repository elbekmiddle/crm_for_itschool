import { Global, Logger, Module } from '@nestjs/common';
import { Pool } from 'pg';
import { ConfigService } from '@nestjs/config';
import { DbService } from './db.service';
import { SchemaBootstrapService } from './schema-bootstrap.service';

@Global()
@Module({
  providers: [
    {
      provide: 'DATABASE_POOL',
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const pool = new Pool({
          host: configService.get<string>('DB_HOST', 'localhost'),
          port: configService.get<number>('DB_PORT', 5432),
          user: configService.get<string>('DB_USER', 'root'),
          password: configService.get<string>('DB_PASSWORD', 'password'),
          database: configService.get<string>('DB_NAME', 'it_school_crm'),
          max: configService.get<number>('DB_POOL_MAX', 24),
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: configService.get<number>('DB_CONNECTION_TIMEOUT_MS', 30000),
          keepAlive: true,
        });
        const log = new Logger('DatabasePool');
        pool.on('error', (err) => {
          log.error(`Pool client error: ${err.message}`);
        });
        return pool;
      },
    },
    DbService,
    SchemaBootstrapService,
  ],
  exports: ['DATABASE_POOL', DbService],
})
export class DbModule {}
