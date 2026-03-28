import { NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { DbService } from '../../infrastructure/database/db.service';
export interface Response<T> {
    success: boolean;
    data: T;
}
export declare class TransformInterceptor<T> implements NestInterceptor<T, Response<T>> {
    private readonly dbService;
    constructor(dbService: DbService);
    intercept(context: ExecutionContext, next: CallHandler): Observable<Response<T>>;
}
