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
console.log(`[seed] env loaded from ${envPath}`);

require('ts-node/register/transpile-only');

const { runSeedCli } = require('../src/seed/seed.cli.ts');

const mode = process.argv[2] === 'reset' ? 'reset' : 'dev';
console.log(`[seed] mode ${mode}`);

runSeedCli(mode).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
