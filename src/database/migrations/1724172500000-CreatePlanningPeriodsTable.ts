import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePlanningPeriodsTable1724172500000 implements MigrationInterface {
  name = 'CreatePlanningPeriodsTable1724172500000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`planning_periods\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`name\` varchar(255) NOT NULL,
        \`start_date\` date NOT NULL,
        \`end_date\` date NOT NULL,
        \`status\` varchar(16) NOT NULL DEFAULT 'DRAFT',
        \`version\` int NOT NULL DEFAULT 1,
        \`published_at\` datetime NULL,
        \`published_by_id\` int NULL,
        \`notes\` text NULL,
        \`company_id\` int NOT NULL,
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        UNIQUE KEY \`IDX_planning_periods_company_name\` (\`company_id\`, \`name\`),
        KEY \`IDX_planning_periods_company_dates\` (\`company_id\`, \`start_date\`, \`end_date\`),
        PRIMARY KEY (\`id\`),
        CONSTRAINT \`FK_planning_periods_company\` FOREIGN KEY (\`company_id\`) REFERENCES \`companies\` (\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION,
        CONSTRAINT \`FK_planning_periods_user\` FOREIGN KEY (\`published_by_id\`) REFERENCES \`usuarios\` (\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION
      ) ENGINE=InnoDB
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS `planning_periods`');
  }
}
