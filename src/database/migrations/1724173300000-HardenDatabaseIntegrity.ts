import { MigrationInterface, QueryRunner } from 'typeorm';

export class HardenDatabaseIntegrity1724173300000 implements MigrationInterface {
  name = 'HardenDatabaseIntegrity1724173300000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await this.dropIndexByColumns(queryRunner, 'calendarios', ['nombre']);
    await this.dropIndexByColumns(queryRunner, 'calendarios', ['year']);
    await this.dropIndexByColumns(queryRunner, 'dias_laborables', ['dia']);
    await this.dropIndexByColumns(queryRunner, 'turno_dias', ['shift_id', 'day_of_week']);
    await this.dropIndexByColumns(queryRunner, 'turno_overrides', ['employee_id', 'date']);

    await queryRunner.query(`
      ALTER TABLE \`calendarios\`
      ADD UNIQUE KEY \`IDX_calendarios_company_nombre\` (\`company_id\`, \`nombre\`),
      ADD UNIQUE KEY \`IDX_calendarios_company_year\` (\`company_id\`, \`year\`)
    `);

    await queryRunner.query(`
      ALTER TABLE \`dias_laborables\`
      ADD UNIQUE KEY \`IDX_dias_laborables_calendar_day\` (\`calendario_id\`, \`dia\`)
    `);

    await queryRunner.query(`
      ALTER TABLE \`turno_dias\`
      ADD UNIQUE KEY \`IDX_turno_dias_shift_day\` (\`shift_id\`, \`day_of_week\`)
    `);

    await queryRunner.query(`
      ALTER TABLE \`turno_overrides\`
      ADD UNIQUE KEY \`IDX_turno_overrides_employee_date\` (\`employee_id\`, \`date\`)
    `);

    await queryRunner.query(`
      ALTER TABLE \`employees\`
      ADD UNIQUE KEY \`UQ_employees_id_company_id\` (\`id\`, \`company_id\`)
    `);

    await queryRunner.query(`
      ALTER TABLE \`turnos\`
      ADD UNIQUE KEY \`UQ_turnos_id_company_id\` (\`id\`, \`company_id\`)
    `);

    await queryRunner.query(`
      ALTER TABLE \`work_locations\`
      ADD UNIQUE KEY \`UQ_work_locations_id_company_id\` (\`id\`, \`company_id\`)
    `);

    await queryRunner.query(`
      ALTER TABLE \`usuarios\`
      ADD UNIQUE KEY \`UQ_usuarios_id_company_id\` (\`id\`, \`company_id\`)
    `);

    await queryRunner.query(`
      ALTER TABLE \`api_keys\`
      ADD CONSTRAINT \`FK_api_keys_user_company\`
        FOREIGN KEY (\`user_id\`, \`company_id\`) REFERENCES \`usuarios\` (\`id\`, \`company_id\`)
        ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE \`employee_location_assignments\`
      ADD UNIQUE KEY \`IDX_employee_location_assignments_company_employee_range\` (\`company_id\`, \`employee_id\`, \`valid_from\`, \`valid_to\`),
      ADD CONSTRAINT \`FK_employee_location_assignments_employee_company\`
        FOREIGN KEY (\`employee_id\`, \`company_id\`) REFERENCES \`employees\` (\`id\`, \`company_id\`)
        ON DELETE CASCADE ON UPDATE NO ACTION,
      ADD CONSTRAINT \`FK_employee_location_assignments_work_location_company\`
        FOREIGN KEY (\`work_location_id\`, \`company_id\`) REFERENCES \`work_locations\` (\`id\`, \`company_id\`)
        ON DELETE RESTRICT ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE \`turno_asignaciones\`
      ADD CONSTRAINT \`FK_turno_asignaciones_employee_company\`
        FOREIGN KEY (\`employee_id\`, \`company_id\`) REFERENCES \`employees\` (\`id\`, \`company_id\`)
        ON DELETE CASCADE ON UPDATE NO ACTION,
      ADD CONSTRAINT \`FK_turno_asignaciones_shift_company\`
        FOREIGN KEY (\`shift_id\`, \`company_id\`) REFERENCES \`turnos\` (\`id\`, \`company_id\`)
        ON DELETE RESTRICT ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE \`turno_overrides\`
      ADD CONSTRAINT \`FK_turno_overrides_employee_company\`
        FOREIGN KEY (\`employee_id\`, \`company_id\`) REFERENCES \`employees\` (\`id\`, \`company_id\`)
        ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE \`employment_terms\`
      ADD CONSTRAINT \`FK_employment_terms_employee_company\`
        FOREIGN KEY (\`employee_id\`, \`company_id\`) REFERENCES \`employees\` (\`id\`, \`company_id\`)
        ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE \`vacaciones\`
      ADD CONSTRAINT \`FK_vacaciones_employee_company\`
        FOREIGN KEY (\`employee_id\`, \`company_id\`) REFERENCES \`employees\` (\`id\`, \`company_id\`)
        ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE \`permisos\`
      ADD CONSTRAINT \`FK_permisos_employee_company\`
        FOREIGN KEY (\`employee_id\`, \`company_id\`) REFERENCES \`employees\` (\`id\`, \`company_id\`)
        ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE \`incidencias\`
      ADD CONSTRAINT \`FK_incidencias_employee_company\`
        FOREIGN KEY (\`employee_id\`, \`company_id\`) REFERENCES \`employees\` (\`id\`, \`company_id\`)
        ON DELETE CASCADE ON UPDATE NO ACTION
    `);

    await queryRunner.query(`
      ALTER TABLE \`turno_dias\`
      ADD CONSTRAINT \`CHK_turno_dias_day_of_week\`
        CHECK (\`day_of_week\` BETWEEN 0 AND 6),
      ADD CONSTRAINT \`CHK_turno_dias_break_minutes\`
        CHECK (\`break_minutes\` >= 0),
      ADD CONSTRAINT \`CHK_turno_dias_working_minutes\`
        CHECK (\`working_minutes\` IS NULL OR \`working_minutes\` >= 0)
    `);

    await queryRunner.query(`
      ALTER TABLE \`turno_asignaciones\`
      ADD CONSTRAINT \`CHK_turno_asignaciones_valid_range\`
        CHECK (\`valid_to\` IS NULL OR \`valid_to\` >= \`valid_from\`)
    `);

    await queryRunner.query(`
      ALTER TABLE \`employee_location_assignments\`
      ADD CONSTRAINT \`CHK_employee_location_assignments_valid_range\`
        CHECK (\`valid_to\` IS NULL OR \`valid_to\` >= \`valid_from\`)
    `);

    await queryRunner.query(`
      ALTER TABLE \`employment_terms\`
      ADD CONSTRAINT \`CHK_employment_terms_effective_range\`
        CHECK (\`effective_to\` IS NULL OR \`effective_to\` >= \`effective_from\`)
    `);

    await queryRunner.query(`
      ALTER TABLE \`planning_periods\`
      ADD CONSTRAINT \`CHK_planning_periods_date_range\`
        CHECK (\`end_date\` >= \`start_date\`),
      ADD CONSTRAINT \`CHK_planning_periods_status\`
        CHECK (\`status\` IN ('DRAFT', 'PUBLISHED'))
    `);

    await queryRunner.query(`
      ALTER TABLE \`planning_period_audits\`
      ADD CONSTRAINT \`CHK_planning_period_audits_action\`
        CHECK (\`action\` IN ('CREATE', 'UPDATE', 'PUBLISH', 'UNPUBLISH'))
    `);

    await queryRunner.query(`
      ALTER TABLE \`turno_overrides\`
      ADD CONSTRAINT \`CHK_turno_overrides_kind\`
        CHECK (\`kind\` IN ('SHIFT', 'OFF'))
    `);

    await queryRunner.query(`
      ALTER TABLE \`vacaciones\`
      ADD CONSTRAINT \`CHK_vacaciones_date_range\`
        CHECK (\`fin\` >= \`inicio\`),
      ADD CONSTRAINT \`CHK_vacaciones_estado\`
        CHECK (\`estado\` IN ('PENDIENTE', 'APROBADO', 'DENEGADO'))
    `);

    await queryRunner.query(`
      ALTER TABLE \`permisos\`
      ADD CONSTRAINT \`CHK_permisos_time_range\`
        CHECK (\`hora_fin\` > \`hora_inicio\`),
      ADD CONSTRAINT \`CHK_permisos_estado\`
        CHECK (\`estado\` IN ('PENDIENTE', 'APROBADO', 'DENEGADO'))
    `);

    await queryRunner.query(`
      ALTER TABLE \`incidencias\`
      ADD CONSTRAINT \`CHK_incidencias_resuelta\`
        CHECK (\`resuelta\` IN (0, 1))
    `);

    await queryRunner.query(`
      ALTER TABLE \`fichajes\`
      ADD CONSTRAINT \`CHK_fichajes_tipo\`
        CHECK (\`tipo\` IN ('ENTRADA', 'SALIDA'))
    `);

    await queryRunner.query(`
      ALTER TABLE \`time_entry_sessions\`
      ADD CONSTRAINT \`CHK_time_entry_sessions_state\`
        CHECK (\`state\` IN ('WORKING', 'PAUSED', 'COMPLETED')),
      ADD CONSTRAINT \`CHK_time_entry_sessions_range\`
        CHECK (\`finishedAt\` IS NULL OR \`finishedAt\` >= \`startedAt\`)
    `);

    await queryRunner.query(`
      ALTER TABLE \`time_entry_breaks\`
      ADD COLUMN \`active_break_flag\` tinyint GENERATED ALWAYS AS (CASE WHEN \`endedAt\` IS NULL THEN 1 ELSE NULL END) STORED,
      ADD UNIQUE KEY \`UQ_time_entry_breaks_session_active\` (\`session_id\`, \`active_break_flag\`),
      ADD CONSTRAINT \`CHK_time_entry_breaks_range\`
        CHECK (\`endedAt\` IS NULL OR \`endedAt\` >= \`startedAt\`)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('ALTER TABLE `time_entry_breaks` DROP CHECK `CHK_time_entry_breaks_range`');
    await queryRunner.query('ALTER TABLE `time_entry_breaks` DROP INDEX `UQ_time_entry_breaks_session_active`');
    await queryRunner.query('ALTER TABLE `time_entry_breaks` DROP COLUMN `active_break_flag`');

    await queryRunner.query('ALTER TABLE `time_entry_sessions` DROP CHECK `CHK_time_entry_sessions_range`');
    await queryRunner.query('ALTER TABLE `time_entry_sessions` DROP CHECK `CHK_time_entry_sessions_state`');

    await queryRunner.query('ALTER TABLE `fichajes` DROP CHECK `CHK_fichajes_tipo`');
    await queryRunner.query('ALTER TABLE `incidencias` DROP CHECK `CHK_incidencias_resuelta`');
    await queryRunner.query('ALTER TABLE `permisos` DROP CHECK `CHK_permisos_estado`');
    await queryRunner.query('ALTER TABLE `permisos` DROP CHECK `CHK_permisos_time_range`');
    await queryRunner.query('ALTER TABLE `vacaciones` DROP CHECK `CHK_vacaciones_estado`');
    await queryRunner.query('ALTER TABLE `vacaciones` DROP CHECK `CHK_vacaciones_date_range`');
    await queryRunner.query('ALTER TABLE `turno_overrides` DROP CHECK `CHK_turno_overrides_kind`');
    await queryRunner.query('ALTER TABLE `planning_period_audits` DROP CHECK `CHK_planning_period_audits_action`');
    await queryRunner.query('ALTER TABLE `planning_periods` DROP CHECK `CHK_planning_periods_status`');
    await queryRunner.query('ALTER TABLE `planning_periods` DROP CHECK `CHK_planning_periods_date_range`');
    await queryRunner.query('ALTER TABLE `employment_terms` DROP CHECK `CHK_employment_terms_effective_range`');
    await queryRunner.query('ALTER TABLE `employee_location_assignments` DROP CHECK `CHK_employee_location_assignments_valid_range`');
    await queryRunner.query('ALTER TABLE `turno_asignaciones` DROP CHECK `CHK_turno_asignaciones_valid_range`');
    await queryRunner.query('ALTER TABLE `turno_dias` DROP CHECK `CHK_turno_dias_working_minutes`');
    await queryRunner.query('ALTER TABLE `turno_dias` DROP CHECK `CHK_turno_dias_break_minutes`');
    await queryRunner.query('ALTER TABLE `turno_dias` DROP CHECK `CHK_turno_dias_day_of_week`');

    await queryRunner.query('ALTER TABLE `incidencias` DROP FOREIGN KEY `FK_incidencias_employee_company`');
    await queryRunner.query('ALTER TABLE `permisos` DROP FOREIGN KEY `FK_permisos_employee_company`');
    await queryRunner.query('ALTER TABLE `vacaciones` DROP FOREIGN KEY `FK_vacaciones_employee_company`');
    await queryRunner.query('ALTER TABLE `employment_terms` DROP FOREIGN KEY `FK_employment_terms_employee_company`');
    await queryRunner.query('ALTER TABLE `turno_overrides` DROP FOREIGN KEY `FK_turno_overrides_employee_company`');
    await queryRunner.query('ALTER TABLE `turno_asignaciones` DROP FOREIGN KEY `FK_turno_asignaciones_shift_company`');
    await queryRunner.query('ALTER TABLE `turno_asignaciones` DROP FOREIGN KEY `FK_turno_asignaciones_employee_company`');
    await queryRunner.query('ALTER TABLE `employee_location_assignments` DROP FOREIGN KEY `FK_employee_location_assignments_work_location_company`');
    await queryRunner.query('ALTER TABLE `employee_location_assignments` DROP FOREIGN KEY `FK_employee_location_assignments_employee_company`');
    await queryRunner.query('ALTER TABLE `api_keys` DROP FOREIGN KEY `FK_api_keys_user_company`');

    await queryRunner.query('ALTER TABLE `usuarios` DROP INDEX `UQ_usuarios_id_company_id`');
    await queryRunner.query('ALTER TABLE `work_locations` DROP INDEX `UQ_work_locations_id_company_id`');
    await queryRunner.query('ALTER TABLE `turnos` DROP INDEX `UQ_turnos_id_company_id`');
    await queryRunner.query('ALTER TABLE `employees` DROP INDEX `UQ_employees_id_company_id`');

    await queryRunner.query('ALTER TABLE `turno_overrides` DROP INDEX `IDX_turno_overrides_employee_date`');
    await queryRunner.query('ALTER TABLE `turno_dias` DROP INDEX `IDX_turno_dias_shift_day`');
    await queryRunner.query('ALTER TABLE `dias_laborables` DROP INDEX `IDX_dias_laborables_calendar_day`');
    await queryRunner.query('ALTER TABLE `calendarios` DROP INDEX `IDX_calendarios_company_year`');
    await queryRunner.query('ALTER TABLE `calendarios` DROP INDEX `IDX_calendarios_company_nombre`');

    await this.dropIndexByColumns(queryRunner, 'employee_location_assignments', ['company_id', 'employee_id', 'valid_from', 'valid_to']);

    await queryRunner.query(`
      ALTER TABLE \`calendarios\`
      ADD UNIQUE KEY \`IDX_calendarios_nombre\` (\`nombre\`),
      ADD UNIQUE KEY \`IDX_calendarios_year\` (\`year\`)
    `);

    await queryRunner.query(`
      ALTER TABLE \`dias_laborables\`
      ADD UNIQUE KEY \`IDX_dias_laborables_dia\` (\`dia\`)
    `);

    await queryRunner.query(`
      ALTER TABLE \`turno_dias\`
      ADD KEY \`IDX_turno_dias_shift_day\` (\`shift_id\`, \`day_of_week\`)
    `);

    await queryRunner.query(`
      ALTER TABLE \`turno_overrides\`
      ADD KEY \`IDX_turno_overrides_employee_date\` (\`employee_id\`, \`date\`)
    `);

    await queryRunner.query('ALTER TABLE `employee_location_assignments` ADD KEY `IDX_employee_location_assignments_company_employee_range` (`company_id`, `employee_id`, `valid_from`, `valid_to`)');
  }

  private async dropIndexByColumns(queryRunner: QueryRunner, tableName: string, columns: string[]) {
    const table = await queryRunner.getTable(tableName);
    if (!table) {
      return;
    }

    const index = table.indices.find(
      (item) =>
        item.columnNames.length === columns.length &&
        item.columnNames.every((column, position) => column === columns[position])
    );

    if (index) {
      await queryRunner.dropIndex(tableName, index);
    }
  }
}
