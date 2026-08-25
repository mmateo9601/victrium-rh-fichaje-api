import { MigrationInterface, QueryRunner } from 'typeorm';

export class ExpandCorporateSchema1724173600000 implements MigrationInterface {
  name = 'ExpandCorporateSchema1724173600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE \`companies\`
        ADD COLUMN IF NOT EXISTS \`legal_name\` varchar(255) NULL,
        ADD COLUMN IF NOT EXISTS \`tax_id\` varchar(64) NULL,
        ADD COLUMN IF NOT EXISTS \`trade_name\` varchar(255) NULL,
        ADD COLUMN IF NOT EXISTS \`address\` text NULL,
        ADD COLUMN IF NOT EXISTS \`city\` varchar(120) NULL,
        ADD COLUMN IF NOT EXISTS \`province\` varchar(120) NULL,
        ADD COLUMN IF NOT EXISTS \`postal_code\` varchar(20) NULL,
        ADD COLUMN IF NOT EXISTS \`country\` varchar(2) NULL,
        ADD COLUMN IF NOT EXISTS \`phone\` varchar(32) NULL,
        ADD COLUMN IF NOT EXISTS \`contact_email\` varchar(255) NULL,
        ADD COLUMN IF NOT EXISTS \`billing_email\` varchar(255) NULL,
        ADD COLUMN IF NOT EXISTS \`website\` varchar(255) NULL,
        ADD COLUMN IF NOT EXISTS \`logo_url\` varchar(255) NULL,
        ADD COLUMN IF NOT EXISTS \`locale\` varchar(16) NULL,
        ADD COLUMN IF NOT EXISTS \`fiscal_year_start_month\` tinyint NULL,
        ADD COLUMN IF NOT EXISTS \`notes\` text NULL,
        ADD COLUMN IF NOT EXISTS \`metadata\` json NULL,
        ADD COLUMN IF NOT EXISTS \`deleted_at\` datetime NULL,
        ADD COLUMN IF NOT EXISTS \`created_by\` varchar(100) NULL,
        ADD COLUMN IF NOT EXISTS \`updated_by\` varchar(100) NULL
    `);

    await queryRunner.query(`
      ALTER TABLE \`calendarios\`
        ADD COLUMN IF NOT EXISTS \`code\` varchar(64) NULL,
        ADD COLUMN IF NOT EXISTS \`description\` text NULL,
        ADD COLUMN IF NOT EXISTS \`timezone\` varchar(80) NULL,
        ADD COLUMN IF NOT EXISTS \`working_days_per_week\` tinyint NULL,
        ADD COLUMN IF NOT EXISTS \`weekly_target_minutes\` int NULL,
        ADD COLUMN IF NOT EXISTS \`monthly_target_minutes\` int NULL,
        ADD COLUMN IF NOT EXISTS \`notes\` text NULL,
        ADD COLUMN IF NOT EXISTS \`metadata\` json NULL
    `);

    await queryRunner.query(`
      ALTER TABLE \`usuarios\`
        MODIFY COLUMN \`dni\` varchar(64) NULL,
        ADD COLUMN IF NOT EXISTS \`nombre\` varchar(120) NULL,
        ADD COLUMN IF NOT EXISTS \`apellidos\` varchar(180) NULL,
        ADD COLUMN IF NOT EXISTS \`telefono\` varchar(32) NULL,
        ADD COLUMN IF NOT EXISTS \`movil\` varchar(32) NULL,
        ADD COLUMN IF NOT EXISTS \`direccion\` text NULL,
        ADD COLUMN IF NOT EXISTS \`ciudad\` varchar(120) NULL,
        ADD COLUMN IF NOT EXISTS \`provincia\` varchar(120) NULL,
        ADD COLUMN IF NOT EXISTS \`codigo_postal\` varchar(20) NULL,
        ADD COLUMN IF NOT EXISTS \`pais\` varchar(2) NULL,
        ADD COLUMN IF NOT EXISTS \`avatar_url\` varchar(255) NULL,
        ADD COLUMN IF NOT EXISTS \`locale\` varchar(16) NULL,
        ADD COLUMN IF NOT EXISTS \`timezone\` varchar(80) NULL,
        ADD COLUMN IF NOT EXISTS \`email_verified_at\` datetime NULL,
        ADD COLUMN IF NOT EXISTS \`password_changed_at\` datetime NULL,
        ADD COLUMN IF NOT EXISTS \`must_change_password\` tinyint NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS \`last_login_ip\` varchar(64) NULL,
        ADD COLUMN IF NOT EXISTS \`preferences\` json NULL,
        ADD COLUMN IF NOT EXISTS \`notes\` text NULL,
        ADD COLUMN IF NOT EXISTS \`deleted_at\` datetime NULL,
        ADD COLUMN IF NOT EXISTS \`created_by\` varchar(100) NULL,
        ADD COLUMN IF NOT EXISTS \`updated_by\` varchar(100) NULL
    `);

    await queryRunner.query(`
      ALTER TABLE \`employees\`
        MODIFY COLUMN \`dni\` varchar(64) NULL,
        ADD COLUMN IF NOT EXISTS \`nombre\` varchar(120) NULL,
        ADD COLUMN IF NOT EXISTS \`apellidos\` varchar(180) NULL,
        ADD COLUMN IF NOT EXISTS \`email_personal\` varchar(255) NULL,
        ADD COLUMN IF NOT EXISTS \`telefono\` varchar(32) NULL,
        ADD COLUMN IF NOT EXISTS \`movil\` varchar(32) NULL,
        ADD COLUMN IF NOT EXISTS \`direccion\` text NULL,
        ADD COLUMN IF NOT EXISTS \`ciudad\` varchar(120) NULL,
        ADD COLUMN IF NOT EXISTS \`provincia\` varchar(120) NULL,
        ADD COLUMN IF NOT EXISTS \`codigo_postal\` varchar(20) NULL,
        ADD COLUMN IF NOT EXISTS \`pais\` varchar(2) NULL,
        ADD COLUMN IF NOT EXISTS \`fecha_nacimiento\` date NULL,
        ADD COLUMN IF NOT EXISTS \`genero\` varchar(32) NULL,
        ADD COLUMN IF NOT EXISTS \`numero_seguridad_social\` varchar(64) NULL,
        ADD COLUMN IF NOT EXISTS \`iban\` varchar(34) NULL,
        ADD COLUMN IF NOT EXISTS \`titular_iban\` varchar(255) NULL,
        ADD COLUMN IF NOT EXISTS \`cargo\` varchar(150) NULL,
        ADD COLUMN IF NOT EXISTS \`departamento\` varchar(150) NULL,
        ADD COLUMN IF NOT EXISTS \`equipo\` varchar(150) NULL,
        ADD COLUMN IF NOT EXISTS \`manager_employee_id\` int NULL,
        ADD COLUMN IF NOT EXISTS \`fecha_alta\` date NULL,
        ADD COLUMN IF NOT EXISTS \`fecha_baja\` date NULL,
        ADD COLUMN IF NOT EXISTS \`tipo_contrato\` varchar(40) NULL,
        ADD COLUMN IF NOT EXISTS \`modalidad\` varchar(40) NULL,
        ADD COLUMN IF NOT EXISTS \`jornada\` varchar(40) NULL,
        ADD COLUMN IF NOT EXISTS \`puesto\` varchar(150) NULL,
        ADD COLUMN IF NOT EXISTS \`avatar_url\` varchar(255) NULL,
        ADD COLUMN IF NOT EXISTS \`timezone\` varchar(80) NULL,
        ADD COLUMN IF NOT EXISTS \`idioma\` varchar(16) NULL,
        ADD COLUMN IF NOT EXISTS \`work_status\` varchar(32) NULL,
        ADD COLUMN IF NOT EXISTS \`metadata\` json NULL,
        ADD COLUMN IF NOT EXISTS \`notes\` text NULL,
        ADD COLUMN IF NOT EXISTS \`deleted_at\` datetime NULL,
        ADD COLUMN IF NOT EXISTS \`created_by\` varchar(100) NULL,
        ADD COLUMN IF NOT EXISTS \`updated_by\` varchar(100) NULL,
        ADD CONSTRAINT \`FK_employees_manager_employee\`
          FOREIGN KEY (\`manager_employee_id\`) REFERENCES \`employees\` (\`id\`)
          ON DELETE SET NULL ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE \`work_locations\`
        ADD COLUMN IF NOT EXISTS \`contact_name\` varchar(255) NULL,
        ADD COLUMN IF NOT EXISTS \`contact_phone\` varchar(32) NULL,
        ADD COLUMN IF NOT EXISTS \`contact_email\` varchar(255) NULL,
        ADD COLUMN IF NOT EXISTS \`cost_center_code\` varchar(64) NULL,
        ADD COLUMN IF NOT EXISTS \`opening_hours\` json NULL,
        ADD COLUMN IF NOT EXISTS \`notes\` text NULL,
        ADD COLUMN IF NOT EXISTS \`metadata\` json NULL,
        ADD COLUMN IF NOT EXISTS \`deleted_at\` datetime NULL,
        ADD COLUMN IF NOT EXISTS \`created_by\` varchar(100) NULL,
        ADD COLUMN IF NOT EXISTS \`updated_by\` varchar(100) NULL
    `);

    await queryRunner.query(`
      ALTER TABLE \`planning_periods\`
        ADD COLUMN IF NOT EXISTS \`code\` varchar(64) NULL,
        ADD COLUMN IF NOT EXISTS \`description\` text NULL,
        ADD COLUMN IF NOT EXISTS \`locked_at\` datetime NULL,
        ADD COLUMN IF NOT EXISTS \`locked_by_id\` int NULL,
        ADD COLUMN IF NOT EXISTS \`scope\` varchar(32) NULL,
        ADD COLUMN IF NOT EXISTS \`created_by\` varchar(100) NULL,
        ADD COLUMN IF NOT EXISTS \`updated_by\` varchar(100) NULL,
        ADD COLUMN IF NOT EXISTS \`metadata\` json NULL,
        ADD CONSTRAINT \`FK_planning_periods_locked_by\`
          FOREIGN KEY (\`locked_by_id\`) REFERENCES \`usuarios\` (\`id\`)
          ON DELETE SET NULL ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE \`employment_terms\`
        ADD COLUMN IF NOT EXISTS \`daily_contract_minutes\` int NULL,
        ADD COLUMN IF NOT EXISTS \`monthly_contract_minutes\` int NULL,
        ADD COLUMN IF NOT EXISTS \`employment_group\` varchar(80) NULL,
        ADD COLUMN IF NOT EXISTS \`position_title\` varchar(150) NULL,
        ADD COLUMN IF NOT EXISTS \`department_name\` varchar(150) NULL,
        ADD COLUMN IF NOT EXISTS \`team_name\` varchar(150) NULL,
        ADD COLUMN IF NOT EXISTS \`manager_employee_id\` int NULL,
        ADD COLUMN IF NOT EXISTS \`start_shift_minutes_before\` int NULL,
        ADD COLUMN IF NOT EXISTS \`start_shift_minutes_after\` int NULL,
        ADD COLUMN IF NOT EXISTS \`overtime_allowed\` tinyint NULL,
        ADD COLUMN IF NOT EXISTS \`rest_between_shifts_minutes\` int NULL,
        ADD COLUMN IF NOT EXISTS \`break_policy_minutes\` int NULL,
        ADD COLUMN IF NOT EXISTS \`vacation_days_annual\` int NULL,
        ADD COLUMN IF NOT EXISTS \`notice_days\` int NULL,
        ADD COLUMN IF NOT EXISTS \`policy_snapshot\` json NULL,
        ADD COLUMN IF NOT EXISTS \`notes\` text NULL,
        ADD COLUMN IF NOT EXISTS \`metadata\` json NULL,
        ADD COLUMN IF NOT EXISTS \`deleted_at\` datetime NULL,
        ADD COLUMN IF NOT EXISTS \`created_by\` varchar(100) NULL,
        ADD COLUMN IF NOT EXISTS \`updated_by\` varchar(100) NULL,
        ADD CONSTRAINT \`FK_employment_terms_manager_employee\`
          FOREIGN KEY (\`manager_employee_id\`) REFERENCES \`employees\` (\`id\`)
          ON DELETE SET NULL ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE \`turnos\`
        ADD COLUMN IF NOT EXISTS \`short_name\` varchar(80) NULL,
        ADD COLUMN IF NOT EXISTS \`timezone\` varchar(80) NULL,
        ADD COLUMN IF NOT EXISTS \`expected_minutes\` int NULL,
        ADD COLUMN IF NOT EXISTS \`break_minutes_default\` int NULL,
        ADD COLUMN IF NOT EXISTS \`allow_overtime\` tinyint NULL,
        ADD COLUMN IF NOT EXISTS \`grace_minutes_before\` int NULL,
        ADD COLUMN IF NOT EXISTS \`grace_minutes_after\` int NULL,
        ADD COLUMN IF NOT EXISTS \`rest_between_shifts_minutes\` int NULL,
        ADD COLUMN IF NOT EXISTS \`is_night_shift\` tinyint NULL,
        ADD COLUMN IF NOT EXISTS \`workday_type\` varchar(40) NULL,
        ADD COLUMN IF NOT EXISTS \`rotation_start_date\` date NULL,
        ADD COLUMN IF NOT EXISTS \`rotation_pattern\` json NULL,
        ADD COLUMN IF NOT EXISTS \`notes\` text NULL,
        ADD COLUMN IF NOT EXISTS \`metadata\` json NULL,
        ADD COLUMN IF NOT EXISTS \`deleted_at\` datetime NULL,
        ADD COLUMN IF NOT EXISTS \`created_by\` varchar(100) NULL,
        ADD COLUMN IF NOT EXISTS \`updated_by\` varchar(100) NULL
    `);

    await queryRunner.query(`
      ALTER TABLE \`turno_dias\`
        ADD COLUMN IF NOT EXISTS \`notes\` text NULL,
        ADD COLUMN IF NOT EXISTS \`metadata\` json NULL
    `);

    await queryRunner.query(`
      ALTER TABLE \`turno_asignaciones\`
        ADD COLUMN IF NOT EXISTS \`priority\` int NULL,
        ADD COLUMN IF NOT EXISTS \`source\` varchar(32) NULL,
        ADD COLUMN IF NOT EXISTS \`published\` tinyint NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS \`created_by\` varchar(100) NULL,
        ADD COLUMN IF NOT EXISTS \`updated_by\` varchar(100) NULL,
        ADD COLUMN IF NOT EXISTS \`metadata\` json NULL
    `);

    await queryRunner.query(`
      ALTER TABLE \`turno_overrides\`
        CHANGE COLUMN \`kind\` \`type\` varchar(16) NOT NULL DEFAULT 'SHIFT',
        ADD COLUMN IF NOT EXISTS \`source\` varchar(32) NULL,
        ADD COLUMN IF NOT EXISTS \`created_by\` varchar(100) NULL,
        ADD COLUMN IF NOT EXISTS \`updated_by\` varchar(100) NULL,
        ADD COLUMN IF NOT EXISTS \`metadata\` json NULL
    `);

    await queryRunner.query(`
      ALTER TABLE \`time_entry_sessions\`
        ADD COLUMN IF NOT EXISTS \`company_id\` int NULL,
        ADD COLUMN IF NOT EXISTS \`employee_id\` int NULL,
        ADD COLUMN IF NOT EXISTS \`work_location_id\` int NULL,
        ADD COLUMN IF NOT EXISTS \`shift_id\` int NULL,
        ADD COLUMN IF NOT EXISTS \`device_id\` varchar(128) NULL,
        ADD COLUMN IF NOT EXISTS \`timezone\` varchar(80) NULL,
        ADD COLUMN IF NOT EXISTS \`started_latitude\` decimal(10,7) NULL,
        ADD COLUMN IF NOT EXISTS \`started_longitude\` decimal(10,7) NULL,
        ADD COLUMN IF NOT EXISTS \`paused_minutes\` int NULL,
        ADD COLUMN IF NOT EXISTS \`worked_minutes\` int NULL,
        ADD COLUMN IF NOT EXISTS \`expected_minutes\` int NULL,
        ADD COLUMN IF NOT EXISTS \`overtime_minutes\` int NULL,
        ADD COLUMN IF NOT EXISTS \`notes\` text NULL,
        ADD COLUMN IF NOT EXISTS \`metadata\` json NULL
    `);

    await queryRunner.query(`
      ALTER TABLE \`fichajes\`
        ADD COLUMN IF NOT EXISTS \`company_id\` int NULL,
        ADD COLUMN IF NOT EXISTS \`employee_id\` int NULL,
        ADD COLUMN IF NOT EXISTS \`session_id\` int NULL,
        ADD COLUMN IF NOT EXISTS \`work_location_id\` int NULL,
        ADD COLUMN IF NOT EXISTS \`shift_id\` int NULL,
        ADD COLUMN IF NOT EXISTS \`timezone\` varchar(80) NULL,
        ADD COLUMN IF NOT EXISTS \`latitude\` decimal(10,7) NULL,
        ADD COLUMN IF NOT EXISTS \`longitude\` decimal(10,7) NULL,
        ADD COLUMN IF NOT EXISTS \`source_device\` varchar(128) NULL,
        ADD COLUMN IF NOT EXISTS \`notes\` text NULL,
        ADD COLUMN IF NOT EXISTS \`metadata\` json NULL
    `);

    await queryRunner.query(`
      ALTER TABLE \`time_entry_breaks\`
        ADD COLUMN IF NOT EXISTS \`reason\` varchar(255) NULL,
        ADD COLUMN IF NOT EXISTS \`notes\` text NULL,
        ADD COLUMN IF NOT EXISTS \`metadata\` json NULL
    `);

    await queryRunner.query(`
      ALTER TABLE \`vacaciones\`
        ADD COLUMN IF NOT EXISTS \`start_time\` time NULL,
        ADD COLUMN IF NOT EXISTS \`end_time\` time NULL,
        ADD COLUMN IF NOT EXISTS \`days_requested\` decimal(5,2) NULL,
        ADD COLUMN IF NOT EXISTS \`minutes_requested\` int NULL,
        ADD COLUMN IF NOT EXISTS \`type\` varchar(40) NULL,
        ADD COLUMN IF NOT EXISTS \`requested_by_id\` int NULL,
        ADD COLUMN IF NOT EXISTS \`approved_by_id\` int NULL,
        ADD COLUMN IF NOT EXISTS \`rejected_reason\` text NULL,
        ADD COLUMN IF NOT EXISTS \`notes\` text NULL,
        ADD COLUMN IF NOT EXISTS \`metadata\` json NULL
    `);

    await queryRunner.query(`
      ALTER TABLE \`permisos\`
        ADD COLUMN IF NOT EXISTS \`type\` varchar(40) NULL,
        ADD COLUMN IF NOT EXISTS \`minutes_requested\` int NULL,
        ADD COLUMN IF NOT EXISTS \`days_requested\` decimal(5,2) NULL,
        ADD COLUMN IF NOT EXISTS \`requested_by_id\` int NULL,
        ADD COLUMN IF NOT EXISTS \`approved_by_id\` int NULL,
        ADD COLUMN IF NOT EXISTS \`reason\` text NULL,
        ADD COLUMN IF NOT EXISTS \`coverage_employee_id\` int NULL,
        ADD COLUMN IF NOT EXISTS \`notes\` text NULL,
        ADD COLUMN IF NOT EXISTS \`metadata\` json NULL
    `);

    await queryRunner.query(`
      ALTER TABLE \`incidencias\`
        ADD COLUMN IF NOT EXISTS \`type\` varchar(40) NULL,
        ADD COLUMN IF NOT EXISTS \`severity\` varchar(32) NULL,
        ADD COLUMN IF NOT EXISTS \`category\` varchar(80) NULL,
        ADD COLUMN IF NOT EXISTS \`source\` varchar(32) NULL,
        ADD COLUMN IF NOT EXISTS \`reported_by_id\` int NULL,
        ADD COLUMN IF NOT EXISTS \`resolved_by_id\` int NULL,
        ADD COLUMN IF NOT EXISTS \`resolved_at\` datetime NULL,
        ADD COLUMN IF NOT EXISTS \`attachments\` json NULL,
        ADD COLUMN IF NOT EXISTS \`notes\` text NULL,
        ADD COLUMN IF NOT EXISTS \`metadata\` json NULL
    `);

    await queryRunner.query(`
      ALTER TABLE \`api_keys\`
        ADD COLUMN IF NOT EXISTS \`prefix\` varchar(16) NULL,
        ADD COLUMN IF NOT EXISTS \`scopes\` json NULL,
        ADD COLUMN IF NOT EXISTS \`last_used_ip\` varchar(64) NULL,
        ADD COLUMN IF NOT EXISTS \`rotated_at\` datetime NULL,
        ADD COLUMN IF NOT EXISTS \`revoked_at\` datetime NULL,
        ADD COLUMN IF NOT EXISTS \`metadata\` json NULL
    `);

    await queryRunner.query(`
      ALTER TABLE \`auth_sessions\`
        ADD COLUMN IF NOT EXISTS \`ip_address\` varchar(64) NULL,
        ADD COLUMN IF NOT EXISTS \`device_fingerprint\` varchar(255) NULL,
        ADD COLUMN IF NOT EXISTS \`session_name\` varchar(100) NULL,
        ADD COLUMN IF NOT EXISTS \`metadata\` json NULL
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`departments\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`company_id\` int NOT NULL,
        \`name\` varchar(150) NOT NULL,
        \`code\` varchar(64) NOT NULL,
        \`parent_department_id\` int NULL,
        \`manager_employee_id\` int NULL,
        \`description\` text NULL,
        \`active\` tinyint NOT NULL DEFAULT 1,
        \`notes\` text NULL,
        \`metadata\` json NULL,
        \`deleted_at\` datetime NULL,
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`UQ_departments_company_code\` (\`company_id\`, \`code\`),
        UNIQUE KEY \`UQ_departments_company_name\` (\`company_id\`, \`name\`),
        KEY \`IDX_departments_company_active\` (\`company_id\`, \`active\`),
        CONSTRAINT \`FK_departments_company\` FOREIGN KEY (\`company_id\`) REFERENCES \`companies\` (\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION,
        CONSTRAINT \`FK_departments_parent_department\` FOREIGN KEY (\`parent_department_id\`) REFERENCES \`departments\` (\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION,
        CONSTRAINT \`FK_departments_manager_employee\` FOREIGN KEY (\`manager_employee_id\`) REFERENCES \`employees\` (\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`teams\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`company_id\` int NOT NULL,
        \`department_id\` int NULL,
        \`name\` varchar(150) NOT NULL,
        \`code\` varchar(64) NOT NULL,
        \`manager_employee_id\` int NULL,
        \`active\` tinyint NOT NULL DEFAULT 1,
        \`notes\` text NULL,
        \`metadata\` json NULL,
        \`deleted_at\` datetime NULL,
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`UQ_teams_company_code\` (\`company_id\`, \`code\`),
        UNIQUE KEY \`UQ_teams_company_name\` (\`company_id\`, \`name\`),
        KEY \`IDX_teams_company_active\` (\`company_id\`, \`active\`),
        CONSTRAINT \`FK_teams_company\` FOREIGN KEY (\`company_id\`) REFERENCES \`companies\` (\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION,
        CONSTRAINT \`FK_teams_department\` FOREIGN KEY (\`department_id\`) REFERENCES \`departments\` (\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION,
        CONSTRAINT \`FK_teams_manager_employee\` FOREIGN KEY (\`manager_employee_id\`) REFERENCES \`employees\` (\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`company_settings\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`company_id\` int NOT NULL,
        \`setting_key\` varchar(120) NOT NULL,
        \`setting_value\` json NOT NULL,
        \`data_type\` varchar(40) NOT NULL DEFAULT 'json',
        \`active\` tinyint NOT NULL DEFAULT 1,
        \`notes\` text NULL,
        \`metadata\` json NULL,
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`UQ_company_settings_company_key\` (\`company_id\`, \`setting_key\`),
        CONSTRAINT \`FK_company_settings_company\` FOREIGN KEY (\`company_id\`) REFERENCES \`companies\` (\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`audit_logs\` (
        \`id\` char(36) NOT NULL,
        \`company_id\` int NULL,
        \`actor_user_id\` int NULL,
        \`entity_name\` varchar(120) NOT NULL,
        \`entity_id\` varchar(120) NOT NULL,
        \`action\` varchar(40) NOT NULL,
        \`before_data\` json NULL,
        \`after_data\` json NULL,
        \`ip_address\` varchar(64) NULL,
        \`user_agent\` varchar(255) NULL,
        \`reason\` text NULL,
        \`metadata\` json NULL,
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        KEY \`IDX_audit_logs_company_created\` (\`company_id\`, \`created_at\`),
        KEY \`IDX_audit_logs_entity\` (\`entity_name\`, \`entity_id\`),
        CONSTRAINT \`FK_audit_logs_company\` FOREIGN KEY (\`company_id\`) REFERENCES \`companies\` (\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION,
        CONSTRAINT \`FK_audit_logs_actor_user\` FOREIGN KEY (\`actor_user_id\`) REFERENCES \`usuarios\` (\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION
      ) ENGINE=InnoDB
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS `audit_logs`');
    await queryRunner.query('DROP TABLE IF EXISTS `company_settings`');
    await queryRunner.query('DROP TABLE IF EXISTS `teams`');
    await queryRunner.query('DROP TABLE IF EXISTS `departments`');
  }
}
