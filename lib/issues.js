// Loads and validates the issues in data/issues/*.json. Used at build time by
// the Next.js pages and by scripts/validate.mjs; an invalid issue fails the build.
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

export const SITE_URL = 'https://physical-ai-magazine.vercel.app';

export const CATEGORIES = {
  robotics: { he: 'רובוטיקה', en: 'Robotics' },
  humanoids: { he: 'רובוטים הומנואידיים', en: 'Humanoids' },
  models: { he: 'מודלים ובינה גופנית', en: 'Models & Embodied AI' },
  autonomy: { he: 'רכבים ורחפנים אוטונומיים', en: 'Autonomous Vehicles & Drones' },
  hardware: { he: 'חומרה ושבבים', en: 'Hardware & Chips' },
  industry: { he: 'תעשייה ומסחר', en: 'Industry & Business' },
  research: { he: 'מחקר', en: 'Research' },
};

// Top-level tabs; each category belongs to exactly one.
export const SECTIONS = {
  hardware: { he: 'חומרה', en: 'Hardware', categories: ['robotics', 'humanoids', 'hardware'] },
  software: { he: 'תוכנה ומודלים', en: 'Software & Models', categories: ['models', 'research', 'autonomy'] },
  business: { he: 'עסקים', en: 'Business', categories: ['industry'] },
};
export const sectionOf = (category) => Object.keys(SECTIONS).find((s) => SECTIONS[s].categories.includes(category));

// A day's issue grows through the day: the morning edition, then items added at noon and in the evening.
export const EDITIONS = {
  morning: { he: 'בוקר', en: 'Morning', time: '07:00' },
  noon: { he: 'צהריים', en: 'Noon', time: '13:00' },
  evening: { he: 'ערב', en: 'Evening', time: '19:00' },
};

const dataDir = join(process.cwd(), 'data', 'issues');

export function validate(issue, file) {
  const errs = [];
  const need = (cond, msg) => { if (!cond) errs.push(`${file}: ${msg}`); };
  need(/^\d{4}-\d{2}-\d{2}$/.test(issue.date), 'date must be YYYY-MM-DD');
  need(file === `${issue.date}.json`, 'file name must match date');
  for (const k of ['headline_he', 'headline_en', 'intro_he', 'intro_en']) need(issue[k]?.trim(), `missing ${k}`);
  need(Array.isArray(issue.items) && issue.items.length >= 3, 'need at least 3 items');
  need(issue.updated === undefined || EDITIONS[issue.updated], `updated must be one of ${Object.keys(EDITIONS).join('|')}`);
  for (const [i, it] of (issue.items ?? []).entries()) {
    const p = `items[${i}]`;
    need(CATEGORIES[it.category], `${p}.category invalid (${it.category})`);
    need(it.edition === undefined || EDITIONS[it.edition], `${p}.edition must be one of ${Object.keys(EDITIONS).join('|')}`);
    need(!it.why_he === !it.why_en, `${p}: why_he and why_en go together`);
    for (const k of ['title_he', 'title_en', 'summary_he', 'summary_en', 'source_name'])
      need(it[k]?.trim(), `${p}.${k} missing`);
    need(/^https?:\/\//.test(it.source_url ?? ''), `${p}.source_url must be http(s)`);
    need(/[֐-׿]/.test(it.title_he ?? '') && /[֐-׿]/.test(it.summary_he ?? ''), `${p} Hebrew text has no Hebrew letters`);
  }
  return errs;
}

let cache;
// newest first; `number` counts from the oldest issue (No. 1)
export function getIssues() {
  if (cache) return cache;
  const files = existsSync(dataDir) ? readdirSync(dataDir).filter((f) => f.endsWith('.json')).sort().reverse() : [];
  if (!files.length) throw new Error('no issues in data/issues');
  const issues = [];
  const errors = [];
  for (const f of files) {
    let issue;
    try { issue = JSON.parse(readFileSync(join(dataDir, f), 'utf8')); } catch (e) { errors.push(`${f}: invalid JSON (${e.message})`); continue; }
    const errs = validate(issue, f);
    if (errs.length) errors.push(...errs); else issues.push(issue);
  }
  if (errors.length) throw new Error(`invalid issues:\n${errors.join('\n')}`);
  cache = issues.map((issue, i) => ({ ...issue, number: issues.length - i }));
  return cache;
}

export const getIssue = (date) => getIssues().find((i) => i.date === date);

// every item in a tab, newest issue first, each carrying its issue's date and its anchor in that issue
export function getSectionItems(section) {
  const cats = SECTIONS[section]?.categories ?? [];
  return getIssues().flatMap((issue) =>
    issue.items.map((it, i) => ({ ...it, date: issue.date, anchor: `s${i + 1}` })).filter((it) => cats.includes(it.category)));
}

export const fmtDate = (d, loc) =>
  new Date(d + 'T12:00:00Z').toLocaleDateString(loc, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });
