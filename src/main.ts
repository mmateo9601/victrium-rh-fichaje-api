import 'reflect-metadata';

import { NestFactory } from '@nestjs/core';
import { VersioningType } from '@nestjs/common';
import helmet from 'helmet';

import { AppModule } from './app.module';
import { AppLogger } from './common/logging/app-logger.service';
import { GlobalHttpExceptionFilter } from './common/errors/global-http-exception.filter';
import { RequestIdMiddleware } from './common/logging/request-id.middleware';
import { buildSwaggerDocument, setupSwagger } from './common/swagger/swagger.setup';
import { isAllowedCorsOrigin } from './config/cors-origins';
import { createAppConfig } from './config/env.validation';

async function bootstrap() {
  const config = createAppConfig(process.env);
  const logger = new AppLogger(config.logLevel);
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

  app.getHttpAdapter().getInstance().set('trust proxy', config.trustProxy);

  app.use(helmet());
  app.enableCors({
    origin(origin, callback) {
      if (!origin) {
        callback(null, true);
        return;
      }

      if (isAllowedCorsOrigin(origin, config.corsOrigins)) {
        callback(null, true);
        return;
      }

      callback(new Error(`CORS origin not allowed: ${origin}`), false);
    },
    credentials: true,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS']
  });
  app.use(new RequestIdMiddleware().use);

  app.useGlobalFilters(new GlobalHttpExceptionFilter());
  app.useLogger(logger);

  if (config.swaggerEnabled) {
    setupSwagger(app, buildSwaggerDocument(app));
  }

  const port = config.port;
  await app.listen(port);
}

void bootstrap();
