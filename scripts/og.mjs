// Renders the site's Open Graph image (1200x630) per DESIGN.md section 5:
// the masthead band with the name in serif, and a cover drawing on paper
// below it. Writes public/og.png.
// Needs a local Chrome or Edge; run it when the design changes, not per issue.
// Usage: npm run og
import { writeFileSync, mkdirSync, existsSync, rmSync, mkdtempSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { coverSvg } from '../lib/graphics.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'public', 'og.png');

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
:root{--bg:#efebe2;--paper:#f8f6f1;--fg:#1b2028;--acc:#9c5a34;--band:#1d2530;--band-fg:#ece6da;--band-mut:#9aa3b0;--band-line:rgba(236,230,218,.28)}
*{box-sizing:border-box}html,body{margin:0;width:1200px;height:630px;overflow:hidden}
body{background:var(--bg) radial-gradient(rgba(27,32,40,.06) 1px,transparent 1px) 0 0/22px 22px;color:var(--fg);font-family:Heebo,sans-serif;position:relative}
.band{background:var(--band);color:var(--band-fg);height:362px;padding:44px 80px 0}
.meta{display:flex;justify-content:space-between;font-size:20px;letter-spacing:.1em;color:var(--band-mut);font-weight:500;padding-bottom:16px;border-bottom:1px solid var(--band-line)}
h1{font:500 100px/1.05 "Frank Ruhl Libre",serif;text-align:center;margin:30px 0 0;letter-spacing:-.01em}
.en{font:500 32px/1 "Frank Ruhl Libre",serif;text-align:center;margin:14px 0 0;direction:ltr}
.tag{text-align:center;font-size:20px;font-weight:600;letter-spacing:.24em;color:#c98a62;margin-top:16px;direction:ltr;text-transform:uppercase}
.cover{position:absolute;left:80px;bottom:0;width:1040px;height:auto;color:var(--fg);display:block}
</style></head><body>
<div class="band">
<div class="meta"><span>יומן יומי · עברית ואנגלית</span><span>DAILY · HE / EN</span></div>
<h1>מגזין פיזיקל AI</h1>
<div class="en">Physical AI Magazine</div>
<div class="tag">Embodied AI · Robotics · Autonomy</div>
</div>
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
