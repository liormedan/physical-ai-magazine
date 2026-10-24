// The curated playlist in data/videos.json (written by the Reporter from
// scripts/videos.mjs candidates). Missing or malformed data means no player.
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const file = join(process.cwd(), 'data', 'videos.json');

export function getVideos() {
  if (!existsSync(file)) return [];
  const { videos } = JSON.parse(readFileSync(file, 'utf8'));
  const bad = (videos ?? []).filter((v) => !/^[\w-]{11}$/.test(v.id ?? '') || !v.title || !v.channel);
  if (bad.length) throw new Error(`data/videos.json: ${bad.length} video(s) missing a valid id, title or channel`);
  return (videos ?? []).slice(0, 60);
}
