import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { DbService } from '../../infrastructure/database/db.service';

export interface Response<T> {
  success: boolean;
  data: T;
  message: string;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, Response<T>> {
  constructor(private readonly dbService: DbService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<Response<T>> {
    const request = context.switchToHttp().getRequest();
    const { method, url, user } = request;

    // Log mutating actions to audit_logs
    if (['POST', 'PATCH', 'PUT', 'DELETE'].includes(method)) {
      const parts = url.split('/');
      const entity = parts[parts.indexOf('api') + 2] || 'unknown'; // Extracts entity
      
      this.dbService.query(
        `INSERT INTO audit_logs (user_id, action, entity) VALUES ($1, $2, $3)`,
        [user?.id || null, method, entity]
      ).catch(err => console.error('Audit log error:', err));
    }

    return next.handle().pipe(
      map(data => ({
        success: true,
        data: data || {},
        message: "OK"
      })),
    );
  }
}

