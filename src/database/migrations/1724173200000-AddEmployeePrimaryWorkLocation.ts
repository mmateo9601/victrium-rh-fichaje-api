import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEmployeePrimaryWorkLocation1724173200000 implements MigrationInterface {
  name = 'AddEmployeePrimaryWorkLocation1724173200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`employees\`
      ADD COLUMN \`primary_work_location_id\` int NULL AFTER \`company_id\`,
      ADD CONSTRAINT \`FK_employees_primary_work_location\`
        FOREIGN KEY (\`primary_work_location_id\`) REFERENCES \`work_locations\` (\`id\`)
        ON DELETE SET NULL ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`employees\`
      DROP FOREIGN KEY \`FK_employees_primary_work_location\`,
      DROP COLUMN \`primary_work_location_id\`
    `);
  }
}
