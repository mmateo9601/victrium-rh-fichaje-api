import { Module } from '@nestjs/common';

import { DevelopmentSeedService } from './development-seed.service';
import { SeedDatabaseModule } from './seed-database.module';

@Module({
  imports: [SeedDatabaseModule],
  providers: [DevelopmentSeedService],
  exports: [DevelopmentSeedService]
})
export class SeedModule {}
