import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePlanningPeriodAuditsTable1724172600000 implements MigrationInterface {
  name = 'CreatePlanningPeriodAuditsTable1724172600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`planning_period_audits\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`action\` varchar(16) NOT NULL,
        \`previous_status\` varchar(16) NULL,
        \`next_status\` varchar(16) NOT NULL,
        \`previous_version\` int NULL,
        \`next_version\` int NOT NULL,
        \`previous_snapshot\` json NULL,
        \`next_snapshot\` json NOT NULL,
        \`reason\` text NULL,
        \`changed_by_id\` int NULL,
        \`planning_period_id\` int NOT NULL,
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        KEY \`IDX_planning_period_audits_period\` (\`planning_period_id\`, \`created_at\`),
        CONSTRAINT \`FK_planning_period_audits_period\` FOREIGN KEY (\`planning_period_id\`) REFERENCES \`planning_periods\` (\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT \`FK_planning_period_audits_user\` FOREIGN KEY (\`changed_by_id\`) REFERENCES \`usuarios\` (\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION
      ) ENGINE=InnoDB
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS `planning_period_audits`');
  }
}
