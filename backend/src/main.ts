import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { AppModule } from './app.module';
import { getSecurityHeaders } from './common/security/security-headers';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  // One CSP policy for every response, per .agents/security/content-security-policy.md
  const isProduction = process.env.NODE_ENV === 'production';
  app.use(helmet(getSecurityHeaders(isProduction)));
  app.use(cookieParser());

  // Global DTO validation — messages in PT-BR per AGENTS.md
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // CORS — frontend is the only browser client
  const corsOrigin = process.env.CORS_ORIGIN ?? 'http://localhost:3001';
  app.enableCors({
    origin: corsOrigin,
    credentials: true,
  });

  // API versioning — url /api/v1 per .agents/decisions/api-versioning.md
  // Health is excluded from the prefix.
  app.setGlobalPrefix('api/v1', { exclude: ['health'] });

  // Swagger — only in non-production (never exposed in prod)
  if (!isProduction) {
    const config = new DocumentBuilder()
      .setTitle('Portal do Credor API')
      .setDescription('Case Administração Judicial')
      .setVersion('1.0')
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document);
  }

  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port, '0.0.0.0');
}

void bootstrap();
