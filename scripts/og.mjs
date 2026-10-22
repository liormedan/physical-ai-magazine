// Renders the site's Open Graph image (1200x630) per DESIGN.md section 5:
// paper, magazine name in serif, a small cover drawing. Writes static/og.png.
// Needs a local Chrome or Edge; run it when the design changes, not per issue.
// Usage: node scripts/og.mjs
import { writeFileSync, mkdirSync, existsSync, rmSync, mkdtempSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { coverSvg } from './graphics.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'static', 'og.png');

const browsers = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
];
const browser = browsers.find(existsSync);
if (!browser) { console.error('no Chrome/Edge found'); process.exit(1); }

// fixed seed so the shared image stays the same between runs
const cover = coverSvg({ date: 'physical-ai-magazine', items: [{ category: 'models' }] });

const html = `<!doctype html><html lang="he" dir="rtl"><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Frank+Ruhl+Libre:wght@500&family=Heebo:wght@500;600&display=block" rel="stylesheet">
<style>
:root{--bg:#f6f3ec;--paper:#fbf9f4;--fg:#1a1d24;--mut:#6b7280;--line:#d9d3c6;--acc:#a8623a}
*{box-sizing:border-box}html,body{margin:0;width:1200px;height:630px;overflow:hidden}
body{background:var(--bg) radial-gradient(rgba(26,29,36,.07) 1px,transparent 1px) 0 0/22px 22px;color:var(--fg);
font-family:Heebo,sans-serif;padding:54px 80px 0;position:relative}
.meta{display:flex;justify-content:space-between;font-size:20px;letter-spacing:.1em;color:var(--mut);font-weight:500;padding-bottom:16px;border-bottom:1.5px solid var(--fg)}
.rule2{border-top:1.5px solid var(--fg);margin-top:5px}
h1{font:500 104px/1.05 "Frank Ruhl Libre",serif;text-align:center;margin:34px 0 0;letter-spacing:-.01em}
.en{font:500 34px/1 "Frank Ruhl Libre",serif;text-align:center;margin:14px 0 0;direction:ltr}
.tag{text-align:center;font-size:21px;font-weight:600;letter-spacing:.24em;color:var(--acc);margin-top:16px;direction:ltr;text-transform:uppercase}
.cover{position:absolute;left:80px;right:80px;bottom:0;width:1040px;height:auto;color:var(--fg);display:block}
</style></head><body>
<div class="meta"><span>יומן יומי · עברית ואנגלית</span><span>DAILY · HE / EN</span></div><div class="rule2"></div>
<h1>מגזין פיזיקל AI</h1>
<div class="en">Physical AI Magazine</div>
<div class="tag">Embodied AI · Robotics · Autonomy</div>
${cover}
</body></html>`;

const work = mkdtempSync(join(tmpdir(), 'pam-og-'));
const page = join(work, 'og.html');
writeFileSync(page, html);
mkdirSync(dirname(out), { recursive: true });
try {
  execFileSync(browser, [
    '--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run',
    `--user-data-dir=${join(work, 'profile')}`, '--window-size=1200,630',
    '--virtual-time-budget=8000', `--screenshot=${out}`, pathToFileURL(page).href,
  ], { stdio: 'ignore' });
} finally {
  rmSync(work, { recursive: true, force: true });
}
if (!existsSync(out)) { console.error('screenshot failed'); process.exit(1); }
console.log(`wrote ${out}`);
