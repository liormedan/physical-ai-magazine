// Validates and builds the Next.js site locally, then publishes by committing
// and pushing to main. Vercel is connected to the GitHub repo and deploys
// every push to main. Usage: npm run publish-issue
import { execSync } from 'node:child_process';
const run = (cmd) => execSync(cmd, { stdio: 'inherit' });
const out = (cmd) => execSync(cmd, { encoding: 'utf8' }).trim();

run('node scripts/validate.mjs');
run('npm run build');

if (out('git status --porcelain') === '') {
  console.log('nothing to publish: working tree clean');
} else {
  const issue = out('git status --porcelain data/issues').split('\n').map((l) => l.slice(3)).filter(Boolean).pop();
  const msg = issue ? `issue: ${issue.replace(/^data\/issues\//, '').replace(/\.json$/, '')}` : 'update site';
  run('git add -A');
  run(`git commit -q -m "${msg}" -m "Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"`);
}
run('git push origin main');
console.log('pushed; Vercel deploys from main -> https://physical-ai-magazine.vercel.app');
