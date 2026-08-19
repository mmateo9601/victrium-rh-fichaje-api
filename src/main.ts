import 'reflect-metadata';

import { NestFactory } from '@nestjs/core';
import { VersioningType } from '@nestjs/common';
import helmet from 'helmet';

import { AppModule } from './app.module';
import { AppLogger } from './common/logging/app-logger.service';
import { GlobalHttpExceptionFilter } from './common/errors/global-http-exception.filter';
import { RequestIdMiddleware } from './common/logging/request-id.middleware';
import { buildSwaggerDocument, setupSwagger } from './common/swagger/swagger.setup';
import { createAppConfig } from './config/env.validation';

async function bootstrap() {
  const config = createAppConfig(process.env);
  const logger = new AppLogger();
  const app = await NestFactory.create(AppModule, {
    cors: false,
    logger
  });

  app.enableShutdownHooks();
  app.setGlobalPrefix('api');
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1'
  });

  app.use(helmet());
  app.enableCors({
    origin: config.corsOrigins,
    credentials: true
  });
  app.use(new RequestIdMiddleware().use);

  app.useGlobalFilters(new GlobalHttpExceptionFilter());
  app.useLogger(logger);

  setupSwagger(app, buildSwaggerDocument(app));

  const port = config.port;
  await app.listen(port);
}

void bootstrap();
