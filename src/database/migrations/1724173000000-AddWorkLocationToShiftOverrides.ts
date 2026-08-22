import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddWorkLocationToShiftOverrides1724173000000 implements MigrationInterface {
  name = 'AddWorkLocationToShiftOverrides1724173000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`turno_overrides\`
      ADD COLUMN \`work_location_id\` int NULL AFTER \`shift_id\`,
      ADD CONSTRAINT \`FK_turno_overrides_work_location\`
        FOREIGN KEY (\`work_location_id\`) REFERENCES \`work_locations\` (\`id\`)
        ON DELETE SET NULL ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`turno_overrides\`
      DROP FOREIGN KEY \`FK_turno_overrides_work_location\`,
      DROP COLUMN \`work_location_id\`
    `);
  }
}
