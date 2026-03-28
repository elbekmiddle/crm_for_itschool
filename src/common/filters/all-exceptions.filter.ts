import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const msg = exception instanceof HttpException ? exception.getResponse() : 'Internal Server Error';
    let userMessage = typeof msg === 'string' ? msg : (msg as any).message || msg;

    // Uzlocalization for common errors
    if (status === HttpStatus.FORBIDDEN) {
      userMessage = "Kechirasiz, ushbu amalni bajarish uchun sizda ruxsat mavjud emas. (Forbidden Error)";
    } else if (status === HttpStatus.UNAUTHORIZED) {
      userMessage = 'Kirish taqiqlangan yoki ruda ruxsati yo\'q (Unauthorized)';
    } else if (status === HttpStatus.BAD_REQUEST) {
      if (Array.isArray(userMessage)) {
        userMessage = userMessage.map(m => m.includes('UUID') ? `${m} - UUID formatida bo'lishi shart` : m);
      }
    }

    this.logger.error(`HTTP Status: ${status} Error Message: ${JSON.stringify(msg)}`, (exception as any)?.stack);

    response.status(status).json({
      success: false,
      message: userMessage,
      code: status,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}
