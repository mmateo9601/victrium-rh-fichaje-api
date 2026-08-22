import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCompanyDefaultCalendar1724173100000 implements MigrationInterface {
  name = 'AddCompanyDefaultCalendar1724173100000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`companies\`
      ADD COLUMN \`default_calendar_id\` int NULL AFTER \`work_policy\`,
      ADD CONSTRAINT \`FK_companies_default_calendar\`
        FOREIGN KEY (\`default_calendar_id\`) REFERENCES \`calendarios\` (\`id\`)
        ON DELETE SET NULL ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`companies\`
      DROP FOREIGN KEY \`FK_companies_default_calendar\`,
      DROP COLUMN \`default_calendar_id\`
    `);
  }
}
