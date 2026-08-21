import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateShiftsTables1724172200000 implements MigrationInterface {
  name = 'CreateShiftsTables1724172200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`turnos\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`name\` varchar(255) NOT NULL,
        \`code\` varchar(255) NOT NULL,
        \`description\` text NULL,
        \`color\` varchar(24) NULL,
        \`active\` tinyint NOT NULL DEFAULT 1,
        \`company_id\` int NOT NULL,
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        UNIQUE KEY \`IDX_turnos_company_code\` (\`company_id\`, \`code\`),
        UNIQUE KEY \`IDX_turnos_company_name\` (\`company_id\`, \`name\`),
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`turno_dias\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`day_of_week\` tinyint NOT NULL,
        \`working\` tinyint NOT NULL DEFAULT 1,
        \`start_time\` time NULL,
        \`end_time\` time NULL,
        \`break_minutes\` int NOT NULL DEFAULT 0,
        \`working_minutes\` int NULL,
        \`crosses_midnight\` tinyint NOT NULL DEFAULT 0,
        \`shift_id\` int NOT NULL,
        PRIMARY KEY (\`id\`),
        KEY \`IDX_turno_dias_shift_day\` (\`shift_id\`, \`day_of_week\`),
        CONSTRAINT \`FK_turno_dias_shift\` FOREIGN KEY (\`shift_id\`) REFERENCES \`turnos\` (\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`turno_asignaciones\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`valid_from\` date NOT NULL,
        \`valid_to\` date NULL,
        \`notes\` text NULL,
        \`active\` tinyint NOT NULL DEFAULT 1,
        \`company_id\` int NOT NULL,
        \`employee_id\` int NOT NULL,
        \`shift_id\` int NOT NULL,
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        KEY \`IDX_turno_asignaciones_employee_valid_from\` (\`employee_id\`, \`valid_from\`),
        KEY \`IDX_turno_asignaciones_company_employee_range\` (\`company_id\`, \`employee_id\`, \`valid_from\`, \`valid_to\`),
        CONSTRAINT \`FK_turno_asignaciones_company\` FOREIGN KEY (\`company_id\`) REFERENCES \`companies\` (\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION,
        CONSTRAINT \`FK_turno_asignaciones_employee\` FOREIGN KEY (\`employee_id\`) REFERENCES \`employees\` (\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT \`FK_turno_asignaciones_shift\` FOREIGN KEY (\`shift_id\`) REFERENCES \`turnos\` (\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`turno_overrides\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`date\` date NOT NULL,
        \`kind\` varchar(16) NOT NULL DEFAULT 'SHIFT',
        \`notes\` text NULL,
        \`company_id\` int NOT NULL,
        \`employee_id\` int NOT NULL,
        \`shift_id\` int NULL,
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`IDX_turno_overrides_employee_date\` (\`employee_id\`, \`date\`),
        KEY \`IDX_turno_overrides_company_employee_date\` (\`company_id\`, \`employee_id\`, \`date\`),
        CONSTRAINT \`FK_turno_overrides_company\` FOREIGN KEY (\`company_id\`) REFERENCES \`companies\` (\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION,
        CONSTRAINT \`FK_turno_overrides_employee\` FOREIGN KEY (\`employee_id\`) REFERENCES \`employees\` (\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT \`FK_turno_overrides_shift\` FOREIGN KEY (\`shift_id\`) REFERENCES \`turnos\` (\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION
      ) ENGINE=InnoDB
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS `turno_overrides`');
    await queryRunner.query('DROP TABLE IF EXISTS `turno_asignaciones`');
    await queryRunner.query('DROP TABLE IF EXISTS `turno_dias`');
    await queryRunner.query('DROP TABLE IF EXISTS `turnos`');
  }
}
