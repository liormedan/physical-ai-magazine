// Monthly reviews: data/reviews/<YYYY-MM>.json, long-form summaries of the month
// in the field (schema in newsroom/agents/reporter.md). A review that fails
// validation fails the build, like an issue does.
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { CATEGORIES, SECTIONS } from './issues.js';

const dir = join(process.cwd(), 'data', 'reviews');

export function validateReview(r, file) {
  const errs = [];
  const need = (cond, msg) => { if (!cond) errs.push(`${file}: ${msg}`); };
  need(/^\d{4}-\d{2}$/.test(r.month ?? ''), 'month must be YYYY-MM');
  need(file === `${r.month}.json`, 'file name must match month');
  for (const k of ['period_from', 'period_to']) need(/^\d{4}-\d{2}-\d{2}$/.test(r[k] ?? ''), `${k} must be YYYY-MM-DD`);
  for (const k of ['headline_he', 'headline_en', 'intro_he', 'intro_en']) need(r[k]?.trim(), `missing ${k}`);
  need(/[֐-׿]/.test(r.intro_he ?? ''), 'intro_he has no Hebrew letters');
  need(Array.isArray(r.numbers) && r.numbers.length >= 3, 'need at least 3 numbers');
  for (const [i, n] of (r.numbers ?? []).entries()) {
    for (const k of ['value', 'label_he', 'label_en', 'source_name']) need(String(n[k] ?? '').trim(), `numbers[${i}].${k} missing`);
    need(/^https?:\/\//.test(n.source_url ?? ''), `numbers[${i}].source_url must be http(s)`);
  }
  need(Array.isArray(r.sections) && r.sections.length === Object.keys(SECTIONS).length, `sections must be ${Object.keys(SECTIONS).join(', ')}`);
  for (const [si, s] of (r.sections ?? []).entries()) {
    const p = `sections[${si}]`;
    need(SECTIONS[s.key], `${p}.key invalid (${s.key})`);
    for (const k of ['lead_he', 'lead_en']) need(s[k]?.trim(), `${p}.${k} missing`);
    need(Array.isArray(s.items) && s.items.length >= 3, `${p} needs at least 3 items`);
    for (const [i, it] of (s.items ?? []).entries()) {
      const q = `${p}.items[${i}]`;
      need(CATEGORIES[it.category], `${q}.category invalid (${it.category})`);
      for (const k of ['title_he', 'title_en', 'summary_he', 'summary_en', 'why_he', 'why_en', 'source_name'])
        need(it[k]?.trim(), `${q}.${k} missing`);
      need(/^\d{4}-\d{2}-\d{2}$/.test(it.date ?? ''), `${q}.date must be YYYY-MM-DD`);
      need(/^https?:\/\//.test(it.source_url ?? ''), `${q}.source_url must be http(s)`);
    }
  }
  need(Array.isArray(r.watch_he) && Array.isArray(r.watch_en) && r.watch_he.length === r.watch_en.length && r.watch_he.length >= 2, 'watch_he and watch_en: same length, at least 2');
  return errs;
}

let cache;
export function getReviews() {
  if (cache) return cache;
  const files = existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith('.json')).sort().reverse() : [];
  const reviews = [];
  const errors = [];
  for (const f of files) {
    let r;
    try { r = JSON.parse(readFileSync(join(dir, f), 'utf8')); } catch (e) { errors.push(`${f}: invalid JSON (${e.message})`); continue; }
    const errs = validateReview(r, f);
    if (errs.length) errors.push(...errs); else reviews.push(r);
  }
  if (errors.length) throw new Error(`invalid reviews:\n${errors.join('\n')}`);
  cache = reviews;
  return cache;
}

export const getReview = (month) => getReviews().find((r) => r.month === month);
