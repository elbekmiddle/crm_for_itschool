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
    try {
      this.logger.debug(`Executing query: ${queryText}`);
      const result: QueryResult = await this.pool.query(queryText, values);
      return result.rows;
    } catch (error) {
      this.logger.error(`Query failed: ${queryText}`, error.stack);
      throw error;
    }
  }

  /**
   * Safe query for backward-compatible flows.
   * Returns fallback rows when table/column/schema is missing.
   */
  async querySafe<T = any>(queryText: string, values: any[] = [], fallback: T[] = []): Promise<T[]> {
    try {
      this.logger.debug(`Executing query (safe): ${queryText}`);
      const result: QueryResult = await this.pool.query(queryText, values);
      return result.rows as T[];
    } catch (error) {
      const code = (error as any)?.code;
      const isSchemaError = ['42P01', '42703', '3F000'].includes(code);

      if (isSchemaError) {
        this.logger.warn(
          `Schema mismatch for query (code=${code}). Returning fallback rows.`,
        );
        return fallback;
      }

      throw error;
    }
  }

  async getClient() {
    return await this.pool.connect();
  }
}
