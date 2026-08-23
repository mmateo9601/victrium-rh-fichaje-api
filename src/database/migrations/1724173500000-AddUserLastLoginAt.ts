import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUserLastLoginAt1724173500000 implements MigrationInterface {
  name = 'AddUserLastLoginAt1724173500000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`usuarios\`
      ADD COLUMN \`last_login_at\` datetime NULL AFTER \`ultimoFichaje\`
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`usuarios\`
      DROP COLUMN \`last_login_at\`
    `);
  }
}
