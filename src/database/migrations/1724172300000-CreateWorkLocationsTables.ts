import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateWorkLocationsTables1724172300000 implements MigrationInterface {
  name = 'CreateWorkLocationsTables1724172300000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`companies\`
      ADD COLUMN \`timezone\` varchar(80) NULL,
      ADD COLUMN \`work_policy\` json NULL
    `);

    await queryRunner.query(`
      ALTER TABLE \`calendarios\`
      ADD COLUMN \`company_id\` int NULL
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`work_locations\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`name\` varchar(120) NOT NULL,
        \`code\` varchar(40) NOT NULL,
        \`address\` text NULL,
        \`city\` varchar(120) NULL,
        \`province\` varchar(120) NULL,
        \`postal_code\` varchar(20) NULL,
        \`timezone\` varchar(80) NULL,
        \`active\` tinyint NOT NULL DEFAULT 1,
        \`latitude\` decimal(10,7) NULL,
        \`longitude\` decimal(10,7) NULL,
        \`company_id\` int NOT NULL,
        \`calendar_id\` int NULL,
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        UNIQUE KEY \`IDX_work_locations_company_code\` (\`company_id\`, \`code\`),
        UNIQUE KEY \`IDX_work_locations_company_name\` (\`company_id\`, \`name\`),
        PRIMARY KEY (\`id\`),
        KEY \`IDX_work_locations_company_active\` (\`company_id\`, \`active\`),
        CONSTRAINT \`FK_work_locations_company\` FOREIGN KEY (\`company_id\`) REFERENCES \`companies\` (\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION,
        CONSTRAINT \`FK_work_locations_calendar\` FOREIGN KEY (\`calendar_id\`) REFERENCES \`calendarios\` (\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      ALTER TABLE \`calendarios\`
      ADD CONSTRAINT \`FK_calendarios_company\` FOREIGN KEY (\`company_id\`) REFERENCES \`companies\` (\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`employee_location_assignments\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`valid_from\` date NOT NULL,
        \`valid_to\` date NULL,
        \`primary\` tinyint NOT NULL DEFAULT 0,
        \`notes\` varchar(255) NULL,
        \`company_id\` int NOT NULL,
        \`employee_id\` int NOT NULL,
        \`work_location_id\` int NOT NULL,
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        KEY \`IDX_employee_location_assignments_employee_range\` (\`employee_id\`, \`valid_from\`, \`valid_to\`),
        KEY \`IDX_employee_location_assignments_company_employee\` (\`company_id\`, \`employee_id\`),
        CONSTRAINT \`FK_employee_location_assignments_company\` FOREIGN KEY (\`company_id\`) REFERENCES \`companies\` (\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION,
        CONSTRAINT \`FK_employee_location_assignments_employee\` FOREIGN KEY (\`employee_id\`) REFERENCES \`employees\` (\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT \`FK_employee_location_assignments_work_location\` FOREIGN KEY (\`work_location_id\`) REFERENCES \`work_locations\` (\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION
      ) ENGINE=InnoDB
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS `employee_location_assignments`');
    await queryRunner.query('DROP TABLE IF EXISTS `work_locations`');
    await queryRunner.query('ALTER TABLE `calendarios` DROP FOREIGN KEY `FK_calendarios_company`');
    await queryRunner.query('ALTER TABLE `calendarios` DROP COLUMN `company_id`');
    await queryRunner.query('ALTER TABLE `companies` DROP COLUMN `work_policy`');
    await queryRunner.query('ALTER TABLE `companies` DROP COLUMN `timezone`');
  }
}
