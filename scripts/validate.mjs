// Quick check of data/issues/*.json without a full Next.js build.
// Usage: npm run validate
import { getIssues } from '../lib/issues.js';
import { entityMap } from '../lib/entities.js';
import { getReviews } from '../lib/reviews.js';

try {
  const issues = getIssues();
  const badLinks = Object.entries(entityMap()).filter(([n, u]) => !n.trim() || !/^https:\/\/[^\s/]+\.[^\s/]+/.test(u));
  if (badLinks.length) throw new Error(`data/entities.json: bad entry: ${badLinks.map(([n]) => n).join(', ')} (each needs an https:// official site)`);
  getReviews(); // throws on an invalid review
  console.log(`ok: ${issues.length} issue(s); latest ${issues[0].date}`);
} catch (e) {
  console.error(e.message);
  process.exit(1);
}
