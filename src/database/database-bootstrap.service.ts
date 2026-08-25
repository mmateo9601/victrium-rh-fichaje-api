import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { DataSource } from 'typeorm';

import { SuperAdminBootstrapService } from '../bootstrap/super-admin.bootstrap';
import { createAppConfig } from '../config/env.validation';

const STARTUP_LOCK_NAME = 'victrium_rh_fichaje_database_startup';

@Injectable()
export class DatabaseBootstrapService implements OnApplicationBootstrap {
  private running?: Promise<void>;

  constructor(private readonly dataSource: DataSource) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.run();
  }

  async run(): Promise<void> {
    if (!this.running) {
      this.running = this.execute().finally(() => {
        this.running = undefined;
      });
    }

    return this.running;
  }

  private async execute(): Promise<void> {
    if (!this.dataSource.isInitialized) {
      await this.dataSource.initialize();
    }

    const config = createAppConfig(process.env);
    if (!config.database.autoMigrate && !config.bootstrap.superAdmin.enabled) {
      return;
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();

    try {
      await this.acquireLock(queryRunner);

      if (config.database.autoMigrate) {
        const migrations = await this.dataSource.runMigrations();
        if (migrations.length > 0) {
          process.stdout.write(`[startup] applied ${migrations.length} migration(s)\n`);
        }
      }

      if (config.bootstrap.superAdmin.enabled) {
        const bootstrapResult = await new SuperAdminBootstrapService(this.dataSource, config).run();
        process.stdout.write(`[startup] super admin bootstrap: ${bootstrapResult}\n`);
      }
    } finally {
      await this.releaseLock(queryRunner);
      await queryRunner.release();
    }
  }

  private async acquireLock(queryRunner: ReturnType<DataSource['createQueryRunner']>) {
    const rows = (await queryRunner.query(`SELECT GET_LOCK(?, 60) AS locked`, [STARTUP_LOCK_NAME])) as Array<{ locked: number | null }>;
    const locked = rows?.[0]?.locked;
    if (locked !== 1) {
      throw new Error('Could not acquire startup database lock');
    }
  }

  private async releaseLock(queryRunner: ReturnType<DataSource['createQueryRunner']>) {
    await queryRunner.query(`SELECT RELEASE_LOCK(?)`, [STARTUP_LOCK_NAME]);
  }
}
