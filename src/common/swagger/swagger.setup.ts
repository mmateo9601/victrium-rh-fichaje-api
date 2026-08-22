import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export function buildSwaggerDocument(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle('Victrium RH Fichaje API')
    .setDescription(
      'API versionada para fichajes, auth y dominios de RRHH. La autenticacion acepta Bearer JWT o x-api-key en integraciones.'
    )
    .setVersion('1.0.0')
    .addBearerAuth()
    .addApiKey(
      {
        type: 'apiKey',
        in: 'header',
        name: 'x-api-key',
        description: 'Clave de API para integraciones server-to-server.'
      },
      'api-key'
    )
    .build();

  return SwaggerModule.createDocument(app, config, {
    deepScanRoutes: true
  });
}

export function setupSwagger(app: INestApplication, document: ReturnType<typeof buildSwaggerDocument>) {
  SwaggerModule.setup('api/docs', app, document, {
    jsonDocumentUrl: 'api/docs-json'
  });
}
