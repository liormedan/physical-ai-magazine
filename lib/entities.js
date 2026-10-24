import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

// data/entities.json maps a company or project name, exactly as written in the
// text, to its official site. Longest names match first; each name is linked
// once per field.
let compiled;
function load() {
  if (compiled) return compiled;
  const file = join(process.cwd(), 'data', 'entities.json');
  const map = existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : {};
  const names = Object.keys(map).sort((a, b) => b.length - a.length);
  const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // a name must not be glued to other Latin letters or digits (so "1X" is not found in "21X")
  const re = names.length ? new RegExp(`(?<![A-Za-z0-9])(${names.map(esc).join('|')})(?![A-Za-z0-9])`, 'g') : null;
  compiled = { map, re };
  return compiled;
}

export function entityMap() { return load().map; }

// Splits text into plain strings and { name, url } parts.
export function linkParts(text) {
  const { map, re } = load();
  if (!re || !text) return [text];
  const seen = new Set();
  const parts = [];
  let last = 0;
  for (const m of text.matchAll(re)) {
    if (seen.has(m[1])) continue;
    seen.add(m[1]);
    if (m.index > last) parts.push(text.slice(last, m.index));
    parts.push({ name: m[1], url: map[m[1]] });
    last = m.index + m[1].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}
