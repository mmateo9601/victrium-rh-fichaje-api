import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddShiftDaySegments1724172700000 implements MigrationInterface {
  name = 'AddShiftDaySegments1724172700000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE `turno_dias` ADD COLUMN `segments` json NULL AFTER `crosses_midnight`');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE `turno_dias` DROP COLUMN `segments`');
  }
}
