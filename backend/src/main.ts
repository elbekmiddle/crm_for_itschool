import { NestFactory } from '@nestjs/core';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import * as compression from 'compression';
import * as cookieParser from 'cookie-parser';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);
  app.useWebSocketAdapter(new IoAdapter(app));

  // Cookie parser - HTTPOnly cookie'lar uchun
  app.use(cookieParser());

  // Production Security & Performance
  app.use(helmet());
  app.use(compression());

  const isProduction = process.env.NODE_ENV === 'production';
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'http://192.168.1.137:5173',
    'http://192.168.1.137:5174'
  ]

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

  const enableSwagger =
    process.env.NODE_ENV !== 'production' ||
    process.env.ENABLE_SWAGGER === 'true';

  if (enableSwagger) {
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
    logger.log(`Swagger: http://localhost:${process.env.PORT || 3000}/api/v1/docs`);
  } else {
    logger.log('Swagger o‘chirilgan (NODE_ENV=production). Staging uchun: ENABLE_SWAGGER=true');
  }

  const port = process.env.PORT || 3000;
  await app.listen(port);
  logger.log(`API: http://localhost:${port}/api/v1`);
}
bootstrap();
