import { MigrationInterface, QueryRunner } from 'typeorm';

export class ExpandRolesEnum1724173400000 implements MigrationInterface {
  name = 'ExpandRolesEnum1724173400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`roles\`
      MODIFY \`rolNombre\` enum(
        'ROLE_SUPER_ADMIN',
        'ROLE_ADMIN',
        'ROLE_COMPANY_ADMIN',
        'ROLE_RRHH',
        'ROLE_MANAGER',
        'ROLE_USER',
        'ROLE_AUDITOR',
        'ROLE_WORKFORCE_REPRESENTATIVE'
      ) NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`roles\`
      MODIFY \`rolNombre\` enum(
        'ROLE_SUPER_ADMIN',
        'ROLE_ADMIN',
        'ROLE_COMPANY_ADMIN',
        'ROLE_RRHH',
        'ROLE_USER'
      ) NOT NULL
    `);
  }
}
