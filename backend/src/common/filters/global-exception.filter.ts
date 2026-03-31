import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Vaqtinchalik xatolik ro\'y berdi';
    let errorObj = null;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res: any = exception.getResponse();
      message = typeof res === 'string' ? res : res.message || message;
      errorObj = res.error || null;
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    // Global format { statusCode, message, error }
    response.status(status).json({
      statusCode: status,
      message,
      error: errorObj || (status === 500 ? 'Internal Server Error' : 'Bad Request')
    });
  }
}
