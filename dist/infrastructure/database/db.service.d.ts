import { OnModuleInit } from '@nestjs/common';
import { Pool } from 'pg';
export declare class DbService implements OnModuleInit {
    private readonly pool;
    private readonly logger;
    constructor(pool: Pool);
    onModuleInit(): Promise<void>;
    query<T = any>(queryText: string, values?: any[]): Promise<T[]>;
    getClient(): Promise<import("pg").PoolClient>;
}
