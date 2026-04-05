import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import * as compression from 'compression';
import * as cookieParser from 'cookie-parser';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Cookie parser - HTTPOnly cookie'lar uchun
  app.use(cookieParser());

  // Production Security & Performance
  app.use(helmet());
  app.use(compression());
  
  const isProduction = process.env.NODE_ENV === 'production';
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175'];
  
  app.enableCors({
    origin: (origin, callback) => {
      // In development, allow all origins
      if (!isProduction || !origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('CORS xatoligi: Bu domen (origin) ruxsat berilganlar ro\'yxatida yo\'q: ' + origin));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-refresh-token'],
  });
  
  app.setGlobalPrefix('api/v1');

  // Global Logic
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new AllExceptionsFilter());

  // Swagger API Documentation
  const config = new DocumentBuilder()
    .setTitle('IT School CRM + LMS API')
    .setDescription('Production-grade Backend for Educational Management')
    .setVersion('2.0')
    .addTag('students')
    .addTag('groups')
    .addTag('exams')
    .addBearerAuth()
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/v1/docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}/api/docs`);
}
bootstrap();
