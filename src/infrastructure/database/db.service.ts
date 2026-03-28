import { Injectable, Inject, Logger, OnModuleInit } from '@nestjs/common';
import { Pool, QueryResult } from 'pg';

@Injectable()
export class DbService implements OnModuleInit {
  private readonly logger = new Logger(DbService.name);

  constructor(@Inject('DATABASE_POOL') private readonly pool: Pool) {}

  async onModuleInit() {
    this.logger.log('Database service initialized.');
  }

  async query<T = any>(queryText: string, values?: any[]): Promise<T[]> {
    this.logger.debug(`Executing query: ${queryText}`);
    const result: QueryResult = await this.pool.query(queryText, values);
    return result.rows;
  }

  async getClient() {
    return await this.pool.connect();
  }
}
