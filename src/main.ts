import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import helmet from 'helmet';
import * as compression from 'compression';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(helmet());
  app.use(compression());
  app.enableCors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3001', 'http://localhost:3000'],
    credentials: true,
  });

  app.setGlobalPrefix('api/v1', {
    exclude: ['api/docs', 'favicon.ico'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  app.useGlobalFilters(new AllExceptionsFilter());


  const config = new DocumentBuilder()
    .setTitle('IT School CRM API')
    .setDescription('It school crm')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/v1/docs', app, document, {
    customCss: `
      html { background-color: #000; }
      body { filter: invert(1) hue-rotate(180deg); margin: 0; background-color: #fff; }
      .swagger-ui .highlight-code { filter: invert(1) hue-rotate(180deg); }
    `,
    customSiteTitle: 'IT School CRM API Docs',
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`🚀 Application is running on: http://localhost:${port}/api/v1`);
  console.log(`🚀 Swagger docs available at: http://localhost:${port}/api/v1/docs`);
}
bootstrap();
