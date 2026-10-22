// Quick check of data/issues/*.json without a full Next.js build.
// Usage: npm run validate
import { getIssues } from '../lib/issues.js';

try {
  const issues = getIssues();
  console.log(`ok: ${issues.length} issue(s); latest ${issues[0].date}`);
} catch (e) {
  console.error(e.message);
  process.exit(1);
}
