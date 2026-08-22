import 'reflect-metadata';

import { NestFactory } from '@nestjs/core';

import { DevelopmentSeedService, SeedRunMode } from './development-seed.service';
import { SeedModule } from './seed.module';

export async function runSeedCli(mode: SeedRunMode) {
  process.stdout.write('[seed] starting Nest context\n');
  let app;

  try {
    app = await NestFactory.createApplicationContext(SeedModule, {
      logger: ['error', 'warn', 'log']
    });
  } catch (error) {
    process.stderr.write('[seed] failed to create Nest context\n');
    process.stderr.write(`${String(error)}\n`);
    throw error;
  }

  try {
    process.stdout.write('[seed] running seed service\n');
    const seedService = app.get(DevelopmentSeedService);
    const summary = await seedService.run(mode);
    process.stdout.write('[seed] seed completed\n');
    process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
  } finally {
    await app.close();
  }
}

if (require.main === module) {
  const mode = process.argv[2] === 'reset' ? 'reset' : 'dev';
  runSeedCli(mode).catch((error) => {
    process.stderr.write(`${String(error)}\n`);
    process.exitCode = 1;
  });
}
