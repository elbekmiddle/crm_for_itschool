import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Servisda kutilmagan xatolik yuz berdi';
    let errorObj = null;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res: any = exception.getResponse();
      message = typeof res === 'string' ? res : res.message || message;
      errorObj = res.error || null;
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    // Production format: { success: false, message, error, statusCode }
    response.status(status).json({
      success: false,
      message: Array.isArray(message) ? message[0] : message, // Flatten first validation message
      error: errorObj || this.getDefaultError(status),
      statusCode: status
    });
  }

  private getDefaultError(status: number): string {
    switch (status) {
      case 400: return 'BAD_REQUEST';
      case 401: return 'UNAUTHORIZED';
      case 403: return 'FORBIDDEN';
      case 404: return 'NOT_FOUND';
      case 409: return 'CONFLICT';
      case 500: return 'INTERNAL_SERVER_ERROR';
      default: return 'ERROR';
    }
  }
}
