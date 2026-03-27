import { Injectable, Inject, Logger, OnModuleInit } from '@nestjs/common';
import { Pool, QueryResult } from 'pg';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class DbService implements OnModuleInit {
  private readonly logger = new Logger(DbService.name);

  constructor(@Inject('DATABASE_POOL') private readonly pool: Pool) {}

  async onModuleInit() {
    this.logger.log('Starting DB Initialization check...');
    try {
      const initSqlPath = path.join(process.cwd(), 'database', 'init.sql');
      const seedSqlPath = path.join(process.cwd(), 'database', 'seed.sql');
      
      if (fs.existsSync(initSqlPath)) {
        try {
          const initSql = fs.readFileSync(initSqlPath, 'utf8');
          await this.pool.query(initSql);
          this.logger.log('✔ init.sql schema executed automatically.');
        } catch (e: any) {
          this.logger.warn(`init.sql warning (ignoring): ${e.message}`);
        }
      }

      if (fs.existsSync(seedSqlPath)) {
        try {
          const seedSql = fs.readFileSync(seedSqlPath, 'utf8');
          await this.pool.query(seedSql);
          this.logger.log('✔ seed.sql executed automatically.');
        } catch (e: any) {
          this.logger.warn(`seed.sql warning (ignoring): ${e.message}`);
        }
      }
    } catch (err: any) {
      this.logger.error('Database connection failed totally.', err.message);
    }
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
