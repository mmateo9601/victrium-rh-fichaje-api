import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateEmploymentTermsTable1724172900000 implements MigrationInterface {
  name = 'CreateEmploymentTermsTable1724172900000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`employment_terms\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`effective_from\` date NOT NULL,
        \`effective_to\` date NULL,
        \`weekly_contract_minutes\` int NOT NULL,
        \`annual_contract_minutes\` int NULL,
        \`working_percentage\` decimal(5,2) NULL,
        \`contract_type\` varchar(40) NOT NULL,
        \`policy_version\` int NOT NULL DEFAULT 1,
        \`policy_snapshot\` json NULL,
        \`notes\` text NULL,
        \`active\` tinyint NOT NULL DEFAULT 1,
        \`company_id\` int NOT NULL,
        \`employee_id\` int NOT NULL,
        \`primary_work_location_id\` int NULL,
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        KEY \`IDX_employment_terms_company_employee_from\` (\`company_id\`, \`employee_id\`, \`effective_from\`),
        KEY \`IDX_employment_terms_employee_range\` (\`employee_id\`, \`effective_from\`, \`effective_to\`),
        CONSTRAINT \`FK_employment_terms_company\` FOREIGN KEY (\`company_id\`) REFERENCES \`companies\` (\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION,
        CONSTRAINT \`FK_employment_terms_employee\` FOREIGN KEY (\`employee_id\`) REFERENCES \`employees\` (\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT \`FK_employment_terms_work_location\` FOREIGN KEY (\`primary_work_location_id\`) REFERENCES \`work_locations\` (\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION
      ) ENGINE=InnoDB
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS `employment_terms`');
  }
}
