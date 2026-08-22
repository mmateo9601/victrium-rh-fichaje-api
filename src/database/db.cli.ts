import { AppDataSource } from './data-source';

type MigrationCommand = 'show' | 'run' | 'revert';

function getMigrationsTableName() {
  return (AppDataSource.options.migrationsTableName as string | undefined) ?? 'migrations';
}

async function showMigrations(): Promise<void> {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }

  const queryRunner = AppDataSource.createQueryRunner();
  try {
    const tableName = getMigrationsTableName();
    const tableExists = await queryRunner.hasTable(tableName);
    const executedRows = tableExists ? await queryRunner.query(`SELECT \`name\` FROM \`${tableName}\` ORDER BY \`id\` ASC`) : [];
    const executedNames = new Set<string>(executedRows.map((row: { name: string }) => row.name));
    const allMigrations = AppDataSource.migrations
      .map((migration) => migration.name)
      .filter((name): name is string => typeof name === 'string' && name.length > 0);
    const pendingMigrations = allMigrations.filter((migration) => !executedNames.has(migration));

    process.stdout.write('[migration] executed:\n');
    if (!executedRows.length) {
      process.stdout.write('  - none\n');
    } else {
      for (const migration of executedRows) {
        process.stdout.write(`  - ${migration.name}\n`);
      }
    }

    process.stdout.write('[migration] pending:\n');
    if (!pendingMigrations.length) {
      process.stdout.write('  - none\n');
    } else {
      for (const migration of pendingMigrations) {
        process.stdout.write(`  - ${migration}\n`);
      }
    }
  } finally {
    await queryRunner.release();
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

async function runMigrations(): Promise<void> {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }

  try {
    const migrations = await AppDataSource.runMigrations();
    process.stdout.write(`[migration] applied ${migrations.length} migration(s)\n`);
    for (const migration of migrations) {
      process.stdout.write(`  - ${migration.name}\n`);
    }
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

async function revertMigrations(): Promise<void> {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }

  try {
    await AppDataSource.undoLastMigration();
    process.stdout.write('[migration] reverted last migration\n');
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

export async function runDatabaseCli(command: MigrationCommand): Promise<void> {
  switch (command) {
    case 'show':
      await showMigrations();
      return;
    case 'run':
      await runMigrations();
      return;
    case 'revert':
      await revertMigrations();
      return;
    default:
      throw new Error(`Unsupported migration command: ${String(command)}`);
  }
}

if (require.main === module) {
  const command = (process.argv[2] as MigrationCommand | undefined) ?? 'show';
  runDatabaseCli(command).catch((error) => {
    process.stderr.write(`${String(error)}\n`);
    process.exitCode = 1;
  });
}
