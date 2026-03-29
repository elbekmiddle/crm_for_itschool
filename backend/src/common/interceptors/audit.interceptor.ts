import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { DbService } from '../../infrastructure/database/db.service';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly dbService: DbService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, user, body, ip } = request;

    return next.handle().pipe(
      tap(async () => {
        // Only log write operations
        if (['POST', 'PATCH', 'PUT', 'DELETE'].includes(method)) {
          const action = `${method} ${url}`;
          const entity = url.split('/')[1] || 'unknown';
          
          try {
            await this.dbService.query(
              `INSERT INTO audit_logs (user_id, action, entity, ip_address) 
               VALUES ($1, $2, $3, $4)`,
              [user?.id || null, action, entity, ip]
            );
          } catch (error) {
            console.error('Failed to log audit:', error);
          }
        }
      }),
    );
  }
}
