import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();

    let status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    let message = 'Ichki server xatoligi yuz berdi';

    // Handle Postgres Specific Errors
    if (exception.code === '23505') {
      status = HttpStatus.CONFLICT;
      message = 'Bu maʼlumot allaqachon bazada mavjud (Unique constraint)';
    }
    if (exception.code === '42P01') {
      status = HttpStatus.SERVICE_UNAVAILABLE;
      message = 'Jadval hali tayyor emas. Iltimos, migratsiyani ishga tushiring.';
    }
    if (exception.code === '42703') {
      status = HttpStatus.SERVICE_UNAVAILABLE;
      message = 'Bazadagi ustunlar to‘liq emas. Iltimos, migratsiyani yangilang.';
    }
    if (exception.code === 'ECONNRESET' || exception?.message?.includes('connection timeout')) {
      status = HttpStatus.SERVICE_UNAVAILABLE;
      message = 'Maʼlumotlar bazasi bilan aloqa uzildi. Qayta urinib ko‘ring.';
    }

    if (exception instanceof HttpException) {
      const res = exception.getResponse() as any;
      message = typeof res === 'string' ? res : res.message || message;
    }

    // Common translations
    const translations: Record<string, string> = {
      'Unauthorized': 'Sizga ruxsat berilmagan',
      'Forbidden': 'Bu amalni bajarishga huquqingiz yo‘q',
      'Not Found': 'Maʼlumot topilmadi',
      'Bad Request': 'Noto‘g‘ri so‘rov',
    };

    if (translations[message]) {
      message = translations[message];
    }

    const error =
      exception instanceof HttpException
        ? exception.name
        : 'INTERNAL_SERVER_ERROR';

    response.status(status).json({
      success: false,
      statusCode: status,
      message: message,
      error: error,
    });
  }
}
