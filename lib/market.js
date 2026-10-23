// data/market.json (written by scripts/market.mjs) joined with our own stories:
// a story links to a ticker when one of the ticker's `match` names is in its English title.
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { getIssues } from './issues';

const file = join(process.cwd(), 'data', 'market.json');

export function getMarket() {
  if (!existsSync(file)) return null;
  const market = JSON.parse(readFileSync(file, 'utf8'));
  const stories = getIssues().flatMap((issue) =>
    issue.items.map((it, i) => ({ date: issue.date, anchor: `s${i + 1}`, title_he: it.title_he, title_en: it.title_en })));
  for (const t of market.tickers) {
    t.stories = (t.match ?? []).length
      ? stories.filter((s) => t.match.some((m) => s.title_en.includes(m))).slice(0, 3)
      : [];
  }
  return market;
}
