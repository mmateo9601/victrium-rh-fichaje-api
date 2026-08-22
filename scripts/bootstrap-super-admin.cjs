const fs = require('fs');
const path = require('path');

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) {
      continue;
    }

    const separatorIndex = line.indexOf('=');
    if (separatorIndex === -1) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    let value = line.slice(separatorIndex + 1).trim();

    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

const envPath = path.resolve(__dirname, '..', '.env');
loadEnvFile(envPath);

const distEntry = path.resolve(__dirname, '..', 'dist', 'bootstrap', 'super-admin.cli.js');
const srcEntry = path.resolve(__dirname, '..', 'src', 'bootstrap', 'super-admin.cli.ts');

async function main() {
  if (process.env.NODE_ENV === 'production') {
    if (!fs.existsSync(distEntry)) {
      throw new Error('dist/bootstrap/super-admin.cli.js is missing. Run npm run build before production bootstrap commands.');
    }

    return require(distEntry).runSuperAdminBootstrapCli();
  }

  require('ts-node/register/transpile-only');
  return require(srcEntry).runSuperAdminBootstrapCli();
}

main().catch((error) => {
  process.stderr.write(`${String(error)}\n`);
  process.exitCode = 1;
});
