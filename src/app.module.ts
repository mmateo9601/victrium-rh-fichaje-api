import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

import { JwtAuthGuard } from './common/auth/jwt.guard';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './modules/auth/auth.module';
import { HealthModule } from './modules/health/health.module';
import { TimeEntriesModule } from './modules/time-entries/time-entries.module';
import { UsersModule } from './modules/users/users.module';
import { RolesGuard } from './common/auth/roles.guard';

@Module({
  imports: [DatabaseModule, ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]), HealthModule, UsersModule, AuthModule, TimeEntriesModule],
  providers: [
    JwtAuthGuard,
    RolesGuard,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard
    }
  ]
})
export class AppModule {}
