import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddWorkLocationToShiftAssignments1724172400000 implements MigrationInterface {
  name = 'AddWorkLocationToShiftAssignments1724172400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`turno_asignaciones\`
      ADD COLUMN \`work_location_id\` int NULL,
      ADD KEY \`IDX_turno_asignaciones_work_location\` (\`work_location_id\`),
      ADD CONSTRAINT \`FK_turno_asignaciones_work_location\` FOREIGN KEY (\`work_location_id\`) REFERENCES \`work_locations\` (\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`turno_asignaciones\`
      DROP FOREIGN KEY \`FK_turno_asignaciones_work_location\`,
      DROP KEY \`IDX_turno_asignaciones_work_location\`,
      DROP COLUMN \`work_location_id\`
    `);
  }
}
