import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { createAppConfig } from '../config/env.validation';
import { DatabaseBootstrapService } from './database-bootstrap.service';
import { createTypeOrmOptions } from './typeorm.options';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, cache: true, envFilePath: '.env', validate: createAppConfig }),
    TypeOrmModule.forRootAsync({
      useFactory: () => createTypeOrmOptions(createAppConfig(process.env))
    })
  ],
  providers: [DatabaseBootstrapService],
  exports: [TypeOrmModule]
})
export class DatabaseModule {}
