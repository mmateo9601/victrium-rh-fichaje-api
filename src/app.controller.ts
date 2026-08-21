import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  getRoot() {
    return {
      service: 'victrium-rh-fichaje-api',
      status: 'ok',
      message: 'API en funcionamiento',
      health: '/api/v1/health',
      versionedApi: '/api/v1'
    };
  }
}
