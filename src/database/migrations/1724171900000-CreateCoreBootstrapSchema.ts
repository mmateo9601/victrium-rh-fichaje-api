import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCoreBootstrapSchema1724171900000 implements MigrationInterface {
  name = 'CreateCoreBootstrapSchema1724171900000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`roles\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`rolNombre\` enum('ROLE_SUPER_ADMIN', 'ROLE_ADMIN', 'ROLE_COMPANY_ADMIN', 'ROLE_RRHH', 'ROLE_USER') NOT NULL,
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`UQ_roles_rolNombre\` (\`rolNombre\`)
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`companies\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`name\` varchar(255) NOT NULL,
        \`code\` varchar(255) NOT NULL,
        \`active\` tinyint NOT NULL DEFAULT 1,
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`UQ_companies_name\` (\`name\`),
        UNIQUE KEY \`UQ_companies_code\` (\`code\`)
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`calendarios\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`nombre\` varchar(255) NOT NULL,
        \`active\` tinyint NOT NULL DEFAULT 0,
        \`year\` int NOT NULL,
        \`minutos_mas_entrada\` int NOT NULL,
        \`minutos_menos_entrada\` int NOT NULL,
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`IDX_calendarios_nombre\` (\`nombre\`),
        UNIQUE KEY \`IDX_calendarios_year\` (\`year\`)
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`dias_laborables\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`dia\` date NOT NULL,
        \`hora_inicio\` time NOT NULL,
        \`hora_fin\` time NOT NULL,
        \`calendario_id\` int NOT NULL,
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`IDX_dias_laborables_dia\` (\`dia\`),
        KEY \`IDX_dias_laborables_calendar\` (\`calendario_id\`),
        CONSTRAINT \`FK_dias_laborables_calendar\` FOREIGN KEY (\`calendario_id\`) REFERENCES \`calendarios\` (\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`employees\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`numero\` varchar(255) NOT NULL,
        \`nombre_empleado\` varchar(255) NOT NULL,
        \`email\` varchar(255) NOT NULL,
        \`dni\` varchar(255) NOT NULL,
        \`dias_vacaciones\` int NULL,
        \`horas_generadas\` double NULL,
        \`working\` tinyint NULL,
        \`en_vacaciones\` tinyint NULL,
        \`de_baja\` tinyint NULL,
        \`ultimo_fichaje\` varchar(255) NULL,
        \`company_id\` int NOT NULL,
        \`calendar_id\` int NULL,
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`UQ_employees_email\` (\`email\`),
        UNIQUE KEY \`UQ_employees_dni\` (\`dni\`),
        UNIQUE KEY \`IDX_employees_company_numero\` (\`company_id\`, \`numero\`),
        UNIQUE KEY \`IDX_employees_company_dni\` (\`company_id\`, \`dni\`),
        KEY \`IDX_employees_company_id\` (\`company_id\`),
        KEY \`IDX_employees_calendar_id\` (\`calendar_id\`),
        CONSTRAINT \`FK_employees_company\` FOREIGN KEY (\`company_id\`) REFERENCES \`companies\` (\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION,
        CONSTRAINT \`FK_employees_calendar\` FOREIGN KEY (\`calendar_id\`) REFERENCES \`calendarios\` (\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`usuarios\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`email\` varchar(255) NOT NULL,
        \`password\` varchar(255) NOT NULL,
        \`numero\` varchar(255) NOT NULL,
        \`nombreEmpleado\` varchar(255) NOT NULL,
        \`dni\` varchar(255) NOT NULL,
        \`diasVacaciones\` int NULL,
        \`horasGeneradas\` double NULL,
        \`working\` tinyint NULL,
        \`enVacaciones\` tinyint NULL,
        \`deBaja\` tinyint NULL,
        \`admin\` tinyint NULL,
        \`ultimoFichaje\` varchar(255) NULL,
        \`company_id\` int NULL,
        \`employee_id\` int NULL,
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`UQ_usuarios_email\` (\`email\`),
        UNIQUE KEY \`UQ_usuarios_numero\` (\`numero\`),
        UNIQUE KEY \`UQ_usuarios_dni\` (\`dni\`),
        UNIQUE KEY \`UQ_usuarios_employee_id\` (\`employee_id\`),
        KEY \`IDX_usuarios_company_id\` (\`company_id\`),
        CONSTRAINT \`FK_usuarios_company\` FOREIGN KEY (\`company_id\`) REFERENCES \`companies\` (\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION,
        CONSTRAINT \`FK_usuarios_employee\` FOREIGN KEY (\`employee_id\`) REFERENCES \`employees\` (\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`usuario_rol\` (
        \`usuario_id\` int NOT NULL,
        \`rol_id\` int NOT NULL,
        PRIMARY KEY (\`usuario_id\`, \`rol_id\`),
        KEY \`IDX_usuario_rol_usuario_id\` (\`usuario_id\`),
        KEY \`IDX_usuario_rol_rol_id\` (\`rol_id\`),
        CONSTRAINT \`FK_usuario_rol_usuario\` FOREIGN KEY (\`usuario_id\`) REFERENCES \`usuarios\` (\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT \`FK_usuario_rol_rol\` FOREIGN KEY (\`rol_id\`) REFERENCES \`roles\` (\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`time_entry_sessions\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`usuario_id\` int NOT NULL,
        \`startedAt\` datetime NOT NULL,
        \`finishedAt\` datetime NULL,
        \`state\` varchar(32) NOT NULL DEFAULT 'WORKING',
        \`source\` varchar(32) NOT NULL DEFAULT 'web',
        \`version\` int NOT NULL DEFAULT 1,
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        KEY \`IDX_time_entry_sessions_usuario_finishedAt\` (\`usuario_id\`, \`finishedAt\`),
        CONSTRAINT \`FK_time_entry_sessions_usuario\` FOREIGN KEY (\`usuario_id\`) REFERENCES \`usuarios\` (\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`time_entry_breaks\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`session_id\` int NOT NULL,
        \`startedAt\` datetime NOT NULL,
        \`endedAt\` datetime NULL,
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        KEY \`IDX_time_entry_breaks_session_endedAt\` (\`session_id\`, \`endedAt\`),
        CONSTRAINT \`FK_time_entry_breaks_session\` FOREIGN KEY (\`session_id\`) REFERENCES \`time_entry_sessions\` (\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`fichajes\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`hora\` time NOT NULL,
        \`dia\` date NOT NULL,
        \`tipo\` varchar(16) NOT NULL,
        \`origen\` varchar(255) NOT NULL,
        \`version\` int NOT NULL DEFAULT 1,
        \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
        \`usuario_id\` int NOT NULL,
        PRIMARY KEY (\`id\`),
        KEY \`IDX_fichajes_usuario_dia_hora\` (\`usuario_id\`, \`dia\`, \`hora\`),
        CONSTRAINT \`FK_fichajes_usuario\` FOREIGN KEY (\`usuario_id\`) REFERENCES \`usuarios\` (\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`fichaje_audits\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`time_entry_id\` int NOT NULL,
        \`corrected_by_id\` int NOT NULL,
        \`previousDia\` date NOT NULL,
        \`previousHora\` time NOT NULL,
        \`previousTipo\` varchar(16) NOT NULL,
        \`newDia\` date NOT NULL,
        \`newHora\` time NOT NULL,
        \`newTipo\` varchar(16) NOT NULL,
        \`previousVersion\` int NOT NULL,
        \`newVersion\` int NOT NULL,
        \`reason\` text NOT NULL,
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        PRIMARY KEY (\`id\`),
        KEY \`IDX_fichaje_audits_time_entry_id\` (\`time_entry_id\`),
        CONSTRAINT \`FK_fichaje_audits_time_entry\` FOREIGN KEY (\`time_entry_id\`) REFERENCES \`fichajes\` (\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION,
        CONSTRAINT \`FK_fichaje_audits_corrected_by\` FOREIGN KEY (\`corrected_by_id\`) REFERENCES \`usuarios\` (\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`vacaciones\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`inicio\` date NOT NULL,
        \`fin\` date NOT NULL,
        \`consumidas\` tinyint NOT NULL DEFAULT 0,
        \`estado\` varchar(32) NOT NULL DEFAULT 'PENDIENTE',
        \`aprobado\` tinyint NOT NULL DEFAULT 0,
        \`company_id\` int NOT NULL,
        \`employee_id\` int NOT NULL,
        PRIMARY KEY (\`id\`),
        KEY \`IDX_vacaciones_company_estado\` (\`company_id\`, \`estado\`),
        KEY \`IDX_vacaciones_employee_inicio\` (\`employee_id\`, \`inicio\`),
        CONSTRAINT \`FK_vacaciones_company\` FOREIGN KEY (\`company_id\`) REFERENCES \`companies\` (\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION,
        CONSTRAINT \`FK_vacaciones_employee\` FOREIGN KEY (\`employee_id\`) REFERENCES \`employees\` (\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`permisos\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`hora_inicio\` time NOT NULL,
        \`hora_fin\` time NOT NULL,
        \`dia\` date NOT NULL,
        \`descripcion\` text NOT NULL,
        \`estado\` varchar(32) NOT NULL DEFAULT 'PENDIENTE',
        \`aprobado\` tinyint NOT NULL DEFAULT 0,
        \`company_id\` int NOT NULL,
        \`employee_id\` int NOT NULL,
        PRIMARY KEY (\`id\`),
        KEY \`IDX_permisos_company_dia\` (\`company_id\`, \`dia\`),
        KEY \`IDX_permisos_employee_dia\` (\`employee_id\`, \`dia\`),
        CONSTRAINT \`FK_permisos_company\` FOREIGN KEY (\`company_id\`) REFERENCES \`companies\` (\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION,
        CONSTRAINT \`FK_permisos_employee\` FOREIGN KEY (\`employee_id\`) REFERENCES \`employees\` (\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`incidencias\` (
        \`id\` int NOT NULL AUTO_INCREMENT,
        \`descripcion\` text NOT NULL,
        \`resumen\` varchar(255) NOT NULL,
        \`dia\` date NOT NULL,
        \`resuelta\` tinyint NOT NULL DEFAULT 0,
        \`explicacion\` text NULL,
        \`company_id\` int NOT NULL,
        \`employee_id\` int NOT NULL,
        PRIMARY KEY (\`id\`),
        KEY \`IDX_incidencias_company_dia\` (\`company_id\`, \`dia\`),
        KEY \`IDX_incidencias_employee_dia\` (\`employee_id\`, \`dia\`),
        CONSTRAINT \`FK_incidencias_company\` FOREIGN KEY (\`company_id\`) REFERENCES \`companies\` (\`id\`) ON DELETE RESTRICT ON UPDATE NO ACTION,
        CONSTRAINT \`FK_incidencias_employee\` FOREIGN KEY (\`employee_id\`) REFERENCES \`employees\` (\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION
      ) ENGINE=InnoDB
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS \`auth_sessions\` (
        \`id\` varchar(36) NOT NULL,
        \`user_id\` int NOT NULL,
        \`refresh_token_hash\` varchar(255) NOT NULL,
        \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
        \`expires_at\` datetime NOT NULL,
        \`revoked_at\` datetime NULL,
        \`user_agent\` varchar(255) NULL,
        \`device_name\` varchar(255) NULL,
        PRIMARY KEY (\`id\`),
        KEY \`IDX_auth_sessions_user_id\` (\`user_id\`),
        CONSTRAINT \`FK_auth_sessions_user\` FOREIGN KEY (\`user_id\`) REFERENCES \`usuarios\` (\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION
      ) ENGINE=InnoDB
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE IF EXISTS `auth_sessions`');
    await queryRunner.query('DROP TABLE IF EXISTS `incidencias`');
    await queryRunner.query('DROP TABLE IF EXISTS `permisos`');
    await queryRunner.query('DROP TABLE IF EXISTS `vacaciones`');
    await queryRunner.query('DROP TABLE IF EXISTS `fichaje_audits`');
    await queryRunner.query('DROP TABLE IF EXISTS `fichajes`');
    await queryRunner.query('DROP TABLE IF EXISTS `time_entry_breaks`');
    await queryRunner.query('DROP TABLE IF EXISTS `time_entry_sessions`');
    await queryRunner.query('DROP TABLE IF EXISTS `usuario_rol`');
    await queryRunner.query('DROP TABLE IF EXISTS `usuarios`');
    await queryRunner.query('DROP TABLE IF EXISTS `employees`');
    await queryRunner.query('DROP TABLE IF EXISTS `dias_laborables`');
    await queryRunner.query('DROP TABLE IF EXISTS `calendarios`');
    await queryRunner.query('DROP TABLE IF EXISTS `companies`');
    await queryRunner.query('DROP TABLE IF EXISTS `roles`');
  }
}
