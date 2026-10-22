// Validates/builds locally, then deploys to Vercel production. Usage: node scripts/publish.mjs
import { execSync } from 'node:child_process';
const run = (cmd) => execSync(cmd, { stdio: 'inherit' });
run('node scripts/build.mjs');
run('npx --yes vercel deploy --prod --yes');
console.log('live: https://physical-ai-magazine.vercel.app');
