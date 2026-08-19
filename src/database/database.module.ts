import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { createAppConfig } from '../config/env.validation';
import { createTypeOrmOptions } from './typeorm.options';

const config = createAppConfig(process.env);

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, cache: true }),
    TypeOrmModule.forRoot(createTypeOrmOptions(config))
  ],
  exports: [TypeOrmModule]
})
export class DatabaseModule {}
