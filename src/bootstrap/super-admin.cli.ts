import { AppDataSource } from '../database/data-source';

import { SuperAdminBootstrapService, SuperAdminBootstrapResult } from './super-admin.bootstrap';

export async function runSuperAdminBootstrapCli(): Promise<SuperAdminBootstrapResult> {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }

  try {
    const service = new SuperAdminBootstrapService(AppDataSource);
    return await service.run();
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

if (require.main === module) {
  runSuperAdminBootstrapCli().catch((error) => {
    process.stderr.write(`${String(error)}\n`);
    process.exitCode = 1;
  });
}
