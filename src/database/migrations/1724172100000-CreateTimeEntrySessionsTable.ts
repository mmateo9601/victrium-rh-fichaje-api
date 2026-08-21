import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateTimeEntrySessionsTable1724172100000 implements MigrationInterface {
  name = 'CreateTimeEntrySessionsTable1724172100000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'time_entry_sessions',
        columns: [
          { name: 'id', type: 'int', isPrimary: true, isGenerated: true, generationStrategy: 'increment' },
          { name: 'usuario_id', type: 'int' },
          { name: 'startedAt', type: 'datetime' },
          { name: 'finishedAt', type: 'datetime', isNullable: true },
          { name: 'state', type: 'varchar', length: '32', default: "'WORKING'" },
          { name: 'source', type: 'varchar', length: '32', default: "'web'" },
          { name: 'version', type: 'int', default: 1 },
          { name: 'created_at', type: 'datetime', default: 'CURRENT_TIMESTAMP' },
          { name: 'updated_at', type: 'datetime', default: 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' }
        ],
        indices: [
          { columnNames: ['usuario_id', 'finishedAt'] }
        ]
      }),
      true
    );

    await queryRunner.createForeignKey(
      'time_entry_sessions',
      new TableForeignKey({
        columnNames: ['usuario_id'],
        referencedTableName: 'usuarios',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE'
      })
    );

    await queryRunner.createTable(
      new Table({
        name: 'time_entry_breaks',
        columns: [
          { name: 'id', type: 'int', isPrimary: true, isGenerated: true, generationStrategy: 'increment' },
          { name: 'session_id', type: 'int' },
          { name: 'startedAt', type: 'datetime' },
          { name: 'endedAt', type: 'datetime', isNullable: true },
          { name: 'created_at', type: 'datetime', default: 'CURRENT_TIMESTAMP' },
          { name: 'updated_at', type: 'datetime', default: 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' }
        ],
        indices: [{ columnNames: ['session_id', 'endedAt'] }]
      }),
      true
    );

    await queryRunner.createForeignKey(
      'time_entry_breaks',
      new TableForeignKey({
        columnNames: ['session_id'],
        referencedTableName: 'time_entry_sessions',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE'
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const breaksTable = await queryRunner.getTable('time_entry_breaks');
    if (breaksTable) {
      const fk = breaksTable.foreignKeys.find((foreignKey) => foreignKey.columnNames.includes('session_id'));
      if (fk) {
        await queryRunner.dropForeignKey('time_entry_breaks', fk);
      }
    }
    await queryRunner.dropTable('time_entry_breaks');

    const sessionsTable = await queryRunner.getTable('time_entry_sessions');
    if (sessionsTable) {
      const fk = sessionsTable.foreignKeys.find((foreignKey) => foreignKey.columnNames.includes('usuario_id'));
      if (fk) {
        await queryRunner.dropForeignKey('time_entry_sessions', fk);
      }
    }
    await queryRunner.dropTable('time_entry_sessions');
  }
}
