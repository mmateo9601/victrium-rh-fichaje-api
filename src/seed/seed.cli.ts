import 'reflect-metadata';

import { NestFactory } from '@nestjs/core';

import { DevelopmentSeedService, SeedRunMode } from './development-seed.service';
import { SeedModule } from './seed.module';

export async function runSeedCli(mode: SeedRunMode) {
  console.log('[seed] starting Nest context');
  let app;

  try {
    app = await NestFactory.createApplicationContext(SeedModule, {
      logger: ['error', 'warn', 'log']
    });
  } catch (error) {
    console.error('[seed] failed to create Nest context');
    console.error(error);
    throw error;
  }

  try {
    console.log('[seed] running seed service');
    const seedService = app.get(DevelopmentSeedService);
    const summary = await seedService.run(mode);
    console.log('[seed] seed completed');
    console.log(JSON.stringify(summary, null, 2));
  } finally {
    await app.close();
  }
}

if (require.main === module) {
  const mode = process.argv[2] === 'reset' ? 'reset' : 'dev';
  runSeedCli(mode).catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
