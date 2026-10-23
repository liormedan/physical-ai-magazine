// Lists recent videos from the channels in newsroom/video-channels.json, read
// from each channel's public "Videos" page (no API key; YouTube's RSS feeds
// answer 404 as of October 2026), as candidates for the playlist.
// The Reporter picks from them and writes data/videos.json (schema in
// newsroom/agents/reporter.md). Usage: node scripts/videos.mjs [days=7]
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const { channels } = JSON.parse(readFileSync(join(root, 'newsroom', 'video-channels.json'), 'utf8'));
const cacheFile = join(root, 'newsroom', '.paperclip', 'video-channel-ids.json');
const out = join(root, 'newsroom', 'drafts', 'video-candidates.json');
const days = Number(process.argv[2] ?? 7);
const since = Date.now() - days * 86400_000;
const UA = { 'user-agent': 'Mozilla/5.0 (physical-ai-magazine video list)', 'accept-language': 'en' };

const cache = existsSync(cacheFile) ? JSON.parse(readFileSync(cacheFile, 'utf8')) : {};

async function channelId(handle) {
  if (cache[handle]) return cache[handle];
  const html = await (await fetch(`https://www.youtube.com/${handle}`, { headers: UA })).text();
  const id = html.match(/"externalId":"(UC[\w-]{22})"/)?.[1] ?? html.match(/channel_id=(UC[\w-]{22})/)?.[1];
  if (id) cache[handle] = id;
  return id ?? null;
}

// "3 days ago" -> an ISO date; the page gives only relative ages
const UNIT = { second: 1, minute: 60, hour: 3600, day: 86400, week: 604800, month: 2592000, year: 31536000 };
function ageToDate(text) {
  const m = text?.match(/(\d+)\s+(second|minute|hour|day|week|month|year)s?\s+ago/);
  if (!m) return null;
  return new Date(Date.now() - Number(m[1]) * UNIT[m[2]] * 1000).toISOString().slice(0, 10);
}

function initialData(html) {
  const start = html.indexOf('var ytInitialData = ');
  if (start < 0) return null;
  const from = start + 'var ytInitialData = '.length;
  const end = html.indexOf(';</script>', from);
  return JSON.parse(html.slice(from, end));
}

// every lockupViewModel in the page: one video tile each
function* tiles(node) {
  if (!node || typeof node !== 'object') return;
  if (node.lockupViewModel) yield node.lockupViewModel;
  for (const v of Object.values(node)) yield* tiles(v);
}

const candidates = [];
const misses = [];
for (const ch of channels) {
  try {
    const id = await channelId(ch.handle);
    if (!id) { misses.push(`${ch.handle}: channel id not found`); continue; }
    const html = await (await fetch(`https://www.youtube.com/channel/${id}/videos`, { headers: UA })).text();
    const data = initialData(html);
    if (!data) { misses.push(`${ch.handle}: page had no ytInitialData`); continue; }
    for (const t of tiles(data)) {
      if (t.contentType && t.contentType !== 'LOCKUP_CONTENT_TYPE_VIDEO') continue;
      const meta = t.metadata?.lockupMetadataViewModel;
      // the visible text is short ("8d ago", "609K"); the accessibility labels spell it out
      const parts = (meta?.metadata?.contentMetadataViewModel?.metadataRows ?? [])
        .flatMap((r) => r.metadataParts ?? []).map((p) => p.accessibilityLabel ?? p.text?.content ?? '');
      const published = ageToDate(parts.find((p) => / ago$/.test(p)));
      if (!t.contentId || !published || Date.parse(published) < since) continue;
      const v = parts.find((p) => /views?$/.test(p)) ?? '';
      const n = Number(v.match(/[\d.,]+/)?.[0].replace(/,/g, '') ?? 0);
      const views = Math.round(n * (/thousand/.test(v) ? 1e3 : /million/.test(v) ? 1e6 : /billion/.test(v) ? 1e9 : 1));
      candidates.push({ id: t.contentId, title: meta?.title?.content ?? '', channel: ch.name, published, views });
    }
  } catch (e) {
    misses.push(`${ch.handle}: ${e.message}`);
  }
}

mkdirSync(dirname(cacheFile), { recursive: true });
writeFileSync(cacheFile, JSON.stringify(cache, null, 2));
candidates.sort((a, b) => b.published.localeCompare(a.published) || b.views - a.views);
writeFileSync(out, JSON.stringify({ generated: new Date().toISOString(), days, candidates, misses }, null, 2));
console.log(`${candidates.length} candidates from the last ${days} days -> newsroom/drafts/video-candidates.json`);
if (misses.length) console.log(`not read: ${misses.join('; ')}`);
