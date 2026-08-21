import { MigrationInterface, QueryRunner, Table, TableForeignKey } from 'typeorm';

export class CreateApiKeysTable1724172000000 implements MigrationInterface {
  name = 'CreateApiKeysTable1724172000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'api_keys',
        columns: [
          {
            name: 'id',
            type: 'int',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment'
          },
          {
            name: 'key_hash',
            type: 'varchar',
            length: '128',
            isUnique: true
          },
          {
            name: 'name',
            type: 'varchar',
            length: '100'
          },
          {
            name: 'description',
            type: 'varchar',
            length: '255',
            isNullable: true
          },
          {
            name: 'user_id',
            type: 'int'
          },
          {
            name: 'company_id',
            type: 'int',
            isNullable: true
          },
          {
            name: 'active',
            type: 'tinyint',
            default: 1
          },
          {
            name: 'expires_at',
            type: 'datetime',
            isNullable: true
          },
          {
            name: 'last_used_at',
            type: 'datetime',
            isNullable: true
          },
          {
            name: 'created_at',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP'
          },
          {
            name: 'updated_at',
            type: 'datetime',
            default: 'CURRENT_TIMESTAMP',
            onUpdate: 'CURRENT_TIMESTAMP'
          },
          {
            name: 'created_by',
            type: 'varchar',
            length: '100',
            isNullable: true
          }
        ]
      }),
      true
    );

    await queryRunner.createForeignKeys('api_keys', [
      new TableForeignKey({
        columnNames: ['user_id'],
        referencedTableName: 'usuarios',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE'
      }),
      new TableForeignKey({
        columnNames: ['company_id'],
        referencedTableName: 'companies',
        referencedColumnNames: ['id'],
        onDelete: 'SET NULL'
      })
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('api_keys');
    if (table) {
      const userForeignKey = table.foreignKeys.find((foreignKey) => foreignKey.columnNames.includes('user_id'));
      const companyForeignKey = table.foreignKeys.find((foreignKey) => foreignKey.columnNames.includes('company_id'));

      if (userForeignKey) {
        await queryRunner.dropForeignKey('api_keys', userForeignKey);
      }

      if (companyForeignKey) {
        await queryRunner.dropForeignKey('api_keys', companyForeignKey);
      }
    }

    await queryRunner.dropTable('api_keys');
  }
}
