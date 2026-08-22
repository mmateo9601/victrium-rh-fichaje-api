import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { createAppConfig } from '../config/env.validation';
import { createTypeOrmOptions } from '../database/typeorm.options';

const config = createAppConfig(process.env);

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, cache: true, validate: createAppConfig }),
    TypeOrmModule.forRoot({
      ...createTypeOrmOptions(config),
      synchronize: false,
      migrationsRun: false,
      logging: ['error', 'warn']
    })
  ],
  exports: [TypeOrmModule]
})
export class SeedDatabaseModule {}
