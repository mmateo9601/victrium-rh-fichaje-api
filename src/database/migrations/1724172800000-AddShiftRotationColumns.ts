import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddShiftRotationColumns1724172800000 implements MigrationInterface {
  name = 'AddShiftRotationColumns1724172800000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE `turnos` ADD COLUMN `rotation_start_date` date NULL AFTER `active`');
    await queryRunner.query('ALTER TABLE `turnos` ADD COLUMN `rotation_pattern` json NULL AFTER `rotation_start_date`');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE `turnos` DROP COLUMN `rotation_pattern`');
    await queryRunner.query('ALTER TABLE `turnos` DROP COLUMN `rotation_start_date`');
  }
}
