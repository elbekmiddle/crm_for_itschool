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
    this.logger.error(`HTTP Status: ${status} Error Message: ${JSON.stringify(msg)}`, (exception as any)?.stack);

    response.status(status).json({
      success: false,
      message: typeof msg === 'string' ? msg : (msg as any).message || msg,
      code: status,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}
