// Builds the static bilingual magazine from data/issues/*.json into site/.
// Usage: node scripts/build.mjs   (exits non-zero if any issue is invalid)
import { readFileSync, writeFileSync, readdirSync, mkdirSync, rmSync, existsSync, cpSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { coverSvg, catIcon } from './graphics.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dataDir = join(root, 'data', 'issues');
const siteDir = join(root, 'site');
const staticDir = join(root, 'static');
const SITE_URL = 'https://physical-ai-magazine.vercel.app';

const CATEGORIES = {
  robotics: { he: 'רובוטיקה', en: 'Robotics' },
  humanoids: { he: 'רובוטים הומנואידיים', en: 'Humanoids' },
  models: { he: 'מודלים ובינה גופנית', en: 'Models & Embodied AI' },
  autonomy: { he: 'רכבים ורחפנים אוטונומיים', en: 'Autonomous Vehicles & Drones' },
  hardware: { he: 'חומרה ושבבים', en: 'Hardware & Chips' },
  industry: { he: 'תעשייה ומסחר', en: 'Industry & Business' },
  research: { he: 'מחקר', en: 'Research' },
};

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function validate(issue, file) {
  const errs = [];
  const need = (cond, msg) => { if (!cond) errs.push(`${file}: ${msg}`); };
  need(/^\d{4}-\d{2}-\d{2}$/.test(issue.date), 'date must be YYYY-MM-DD');
  need(file === `${issue.date}.json`, 'file name must match date');
  for (const k of ['headline_he', 'headline_en', 'intro_he', 'intro_en']) need(issue[k]?.trim(), `missing ${k}`);
  need(Array.isArray(issue.items) && issue.items.length >= 3, 'need at least 3 items');
  for (const [i, it] of (issue.items ?? []).entries()) {
    const p = `items[${i}]`;
    need(CATEGORIES[it.category], `${p}.category invalid (${it.category})`);
    for (const k of ['title_he', 'title_en', 'summary_he', 'summary_en', 'source_name'])
      need(it[k]?.trim(), `${p}.${k} missing`);
    need(/^https?:\/\//.test(it.source_url ?? ''), `${p}.source_url must be http(s)`);
    need(/[֐-׿]/.test(it.title_he ?? '') && /[֐-׿]/.test(it.summary_he ?? ''), `${p} Hebrew text has no Hebrew letters`);
  }
  return errs;
}

const fmtDate = (d, loc) =>
  new Date(d + 'T12:00:00Z').toLocaleDateString(loc, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' });

const bi = (he, en, tag = 'span', cls = '') =>
  `<${tag} class="${cls}" lang="he" dir="rtl" data-l="he">${esc(he)}</${tag}><${tag} class="${cls}" lang="en" dir="ltr" data-l="en">${esc(en)}</${tag}>`;

// Design: "ink & circuit" — editorial serif masthead on warm paper, a faint
// calibration dot-grid behind the page, hairline rules instead of cards, and
// one copper accent. Each category has its own muted mark colour.
const css = `
:root{--bg:#f6f3ec;--paper:#fbf9f4;--fg:#1a1d24;--mut:#6b7280;--line:#d9d3c6;--rule:#1a1d24;--acc:#a8623a;--grid:rgba(26,29,36,.07);
--c-robotics:#2f6f8f;--c-humanoids:#8a4f6d;--c-models:#a8623a;--c-autonomy:#4f7a5a;--c-hardware:#6b5e9c;--c-industry:#8c7a3c;--c-research:#3d6b6b}
@media(prefers-color-scheme:dark){:root:not([data-theme=light]){--bg:#121419;--paper:#171a20;--fg:#ebe7dd;--mut:#9aa0ac;--line:#2d313a;--rule:#ebe7dd;--acc:#d08a5c;--grid:rgba(235,231,221,.06);
--c-robotics:#7fb3cf;--c-humanoids:#cf93b3;--c-models:#d08a5c;--c-autonomy:#8fc19d;--c-hardware:#a99bd8;--c-industry:#c9b36a;--c-research:#86b5b5}}
:root[data-theme=dark]{--bg:#121419;--paper:#171a20;--fg:#ebe7dd;--mut:#9aa0ac;--line:#2d313a;--rule:#ebe7dd;--acc:#d08a5c;--grid:rgba(235,231,221,.06)}
*{box-sizing:border-box}
html{background:var(--bg)}
body{margin:0;background:var(--bg) radial-gradient(var(--grid) 1px,transparent 1px) 0 0/22px 22px;color:var(--fg);
font:17px/1.7 Heebo,"Segoe UI",system-ui,-apple-system,Arial,sans-serif;-webkit-font-smoothing:antialiased}
a{color:inherit;text-decoration-color:var(--acc);text-underline-offset:3px}a:hover{color:var(--acc)}
.wrap{max-width:820px;margin:0 auto;padding:0 16px}
.serif,h1,h2,.brand,.lead h2{font-family:"Frank Ruhl Libre",Georgia,"Times New Roman",serif;font-weight:500}
html[data-lang=he] [data-l=en],html[data-lang=en] [data-l=he]{display:none}
.mast{padding-top:28px;text-align:center;border-bottom:1px solid var(--rule);position:relative}
.mast:after{content:"";display:block;height:3px;border-top:1px solid var(--rule);margin-top:3px}
.mast .meta{display:flex;justify-content:space-between;align-items:center;font-size:.78rem;letter-spacing:.08em;text-transform:uppercase;color:var(--mut);padding-bottom:10px;white-space:nowrap;gap:10px}
@media(max-width:520px){.mast .meta{font-size:.68rem;letter-spacing:.04em}}
.brand{display:block;font-size:clamp(2rem,6vw,3.1rem);line-height:1.1;text-decoration:none;color:var(--fg);padding:8px 0 10px;letter-spacing:-.01em}
.brand small{display:block;font:400 .72rem/1 Heebo,sans-serif;letter-spacing:.22em;text-transform:uppercase;color:var(--acc);margin-top:8px}
button#lang{font:500 .78rem/1 Heebo,sans-serif;letter-spacing:.06em;border:1px solid var(--line);background:var(--paper);color:var(--fg);padding:7px 12px;border-radius:2px;cursor:pointer}
button#lang:hover{border-color:var(--acc);color:var(--acc)}
.issue-head{padding:34px 0 10px}
.issue-head .date{font-size:.82rem;letter-spacing:.1em;text-transform:uppercase;color:var(--acc);margin:0 0 10px}
h1{font-size:clamp(1.7rem,4.5vw,2.5rem);line-height:1.22;margin:0 0 14px;font-weight:500}
.intro{font-size:1.08rem;color:var(--mut);margin:0;max-width:62ch;font-style:normal}
hr.rule{border:0;border-top:1px solid var(--line);margin:26px 0 0}
article{padding:26px 0;border-bottom:1px solid var(--line);display:grid;grid-template-columns:minmax(0,1fr);gap:4px}
article.lead{padding:30px 0 32px;border-bottom:1px solid var(--rule)}
article.lead h2{font-size:clamp(1.45rem,3.4vw,1.95rem)}
article.lead p.sum{font-size:1.08rem}
.cat{display:inline-flex;align-items:center;gap:8px;font-size:.74rem;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:var(--mut)}
.cat .ci{width:22px;height:22px;flex:none}
.cover{display:block;width:100%;height:auto;color:var(--fg);margin:18px 0 0;border-top:1px solid var(--line);border-bottom:1px solid var(--line);padding:6px 0}
article h2{font-size:1.32rem;line-height:1.3;margin:6px 0 6px}
article p.sum{margin:0 0 10px;max-width:68ch}
.src{font-size:.84rem;color:var(--mut)}.src a{color:var(--mut)}.src a:hover{color:var(--acc)}
.num{font:400 .74rem/1 Heebo,sans-serif;letter-spacing:.1em;color:var(--mut)}
.back{display:inline-block;margin:28px 0 0;font-size:.9rem}
.archive-h{margin:40px 0 6px;font-size:.78rem;letter-spacing:.14em;text-transform:uppercase;color:var(--acc);font-family:Heebo,sans-serif;font-weight:600}
ul.archive{list-style:none;padding:0;margin:0}
ul.archive li{display:grid;grid-template-columns:auto 1fr;gap:14px;align-items:baseline;padding:14px 0;border-bottom:1px solid var(--line)}
ul.archive a{text-decoration:none;font-family:"Frank Ruhl Libre",Georgia,serif;font-size:1.12rem}
ul.archive .src{display:block;margin-top:2px}
footer{color:var(--mut);font-size:.82rem;padding:34px 0 48px;line-height:1.6}
footer:before{content:"";display:block;width:48px;border-top:1px solid var(--acc);margin:0 auto 18px}
footer p{text-align:center;max-width:60ch;margin:0 auto}
@media(min-width:720px){article{grid-template-columns:150px minmax(0,1fr);column-gap:28px;align-items:start}
article .cat{padding-top:7px}article .body{grid-column:2}article .cat{grid-column:1;grid-row:1}
article.lead{grid-template-columns:minmax(0,1fr)}article.lead .body{grid-column:1}}
`;
const fonts = `<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Frank+Ruhl+Libre:wght@400;500;700&family=Heebo:wght@400;500;600&display=swap" rel="stylesheet">`;

const js = `(function(){var d=document.documentElement,k='pam-lang',l='he';
try{l=localStorage.getItem(k)||(((navigator.language||'').indexOf('he')===0)?'he':'en')}catch(e){}
function set(v){d.setAttribute('lang',v);d.setAttribute('dir',v==='he'?'rtl':'ltr');d.setAttribute('data-lang',v);try{localStorage.setItem(k,v)}catch(e){}}
set(l);document.addEventListener('click',function(e){if(e.target.closest('#lang')){set(d.getAttribute('data-lang')==='he'?'en':'he')}});})();`;

function page({ title_he, title_en, desc_he, body, base, number, date, path }) {
  const title = `${title_he} | ${title_en}`;
  return `<!doctype html>
<html lang="he" dir="rtl" data-lang="he">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc_he)}">
<link rel="canonical" href="${SITE_URL}/${path}">
<meta property="og:type" content="${path ? 'article' : 'website'}">
<meta property="og:site_name" content="מגזין פיזיקל AI | Physical AI Magazine">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc_he)}">
<meta property="og:url" content="${SITE_URL}/${path}">
<meta property="og:image" content="${SITE_URL}/og.png">
<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
<meta property="og:image:alt" content="מגזין פיזיקל AI — שרטוט קווי של זרוע רובוטית על נייר">
<meta property="og:locale" content="he_IL"><meta property="og:locale:alternate" content="en_US">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="${SITE_URL}/og.png"><script>${js}</script>
${fonts}
<style>${css}</style></head>
<body>
<header class="wrap mast">
<div class="meta"><span>${bi(`גיליון ${number}`, `Issue No. ${number}`)}</span>
<button id="lang" type="button" aria-label="Switch language / החלפת שפה">עברית · English</button>
<span>${bi(fmtDate(date, 'he-IL'), fmtDate(date, 'en-US'))}</span></div>
<a class="brand" href="${base}index.html">${bi('מגזין פיזיקל AI', 'Physical AI Magazine')}<small>${bi('יומן יומי של בינה גופנית, רובוטיקה ואוטונומיה', 'A daily record of embodied AI, robotics & autonomy')}</small></a>
</header>
<main class="wrap">${body}</main>
<footer class="wrap">${bi('המגזין נכתב ומתורגם אוטומטית על ידי סוכן בינה מלאכותית ממקורות ציבוריים. כל פריט מקשר למקור. ייתכנו טעויות — בדקו במקור.', 'This magazine is written and translated automatically by an AI agent from public sources. Every item links to its source. Errors are possible — verify at the source.', 'p')}</footer>
</body></html>`;
}

function issueBody(issue, { home }) {
  const items = issue.items.map((it, i) => {
    const c = CATEGORIES[it.category];
    return `<article class="${i === 0 ? 'lead' : ''}" style="--cc:var(--c-${it.category})">
<div class="cat">${catIcon(it.category)}${bi(c.he, c.en)}</div>
<div class="body"><h2>${bi(it.title_he, it.title_en)}</h2>
<p class="sum">${bi(it.summary_he, it.summary_en)}</p>
<div class="src">${bi('מקור', 'Source')}: <a href="${esc(it.source_url)}" rel="noopener" target="_blank">${esc(it.source_name)}</a></div></div></article>`;
  }).join('\n');
  return `<div class="issue-head">
<p class="date">${bi(home ? 'הגיליון האחרון' : 'מהארכיון', home ? 'Latest issue' : 'From the archive')}</p>
<h1>${bi(issue.headline_he, issue.headline_en)}</h1>
<p class="intro">${bi(issue.intro_he, issue.intro_en)}</p></div>
${coverSvg(issue)}
${items}
${home ? '' : `<a class="back" href="../index.html">${bi('← לכל הגיליונות', '← All issues')}</a>`}`;
}

const files = existsSync(dataDir) ? readdirSync(dataDir).filter((f) => f.endsWith('.json')).sort().reverse() : [];
if (!files.length) { console.error('no issues in data/issues'); process.exit(1); }

const issues = [];
const errors = [];
for (const f of files) {
  let issue;
  try { issue = JSON.parse(readFileSync(join(dataDir, f), 'utf8')); } catch (e) { errors.push(`${f}: invalid JSON (${e.message})`); continue; }
  const errs = validate(issue, f);
  if (errs.length) errors.push(...errs); else issues.push(issue);
}
if (errors.length) { console.error(errors.join('\n')); process.exit(1); }

rmSync(siteDir, { recursive: true, force: true });
mkdirSync(join(siteDir, 'issues'), { recursive: true });
if (existsSync(staticDir)) cpSync(staticDir, siteDir, { recursive: true });

// issues are newest-first; issue number counts from the oldest
const numberOf = (i) => issues.length - i;

issues.forEach((issue, i) => {
  writeFileSync(join(siteDir, 'issues', `${issue.date}.html`),
    page({ title_he: issue.headline_he, title_en: issue.headline_en, desc_he: issue.intro_he, body: issueBody(issue, { home: false }), base: '../', number: numberOf(i), date: issue.date, path: `issues/${issue.date}.html` }));
});

const [latest, ...older] = issues;
const archive = older.length
  ? `<h2 class="archive-h">${bi('גיליונות קודמים', 'Previous issues')}</h2><ul class="archive">${older.map((it, j) =>
      `<li><span class="num">${bi(`גיליון ${numberOf(j + 1)}`, `No. ${numberOf(j + 1)}`)}</span><div><a href="issues/${it.date}.html">${bi(it.headline_he, it.headline_en)}</a><span class="src">${bi(fmtDate(it.date, 'he-IL'), fmtDate(it.date, 'en-US'))}</span></div></li>`).join('')}</ul>`
  : '';
writeFileSync(join(siteDir, 'index.html'),
  page({ title_he: 'מגזין פיזיקל AI', title_en: 'Physical AI Magazine', desc_he: 'יומן יומי של בינה גופנית, רובוטיקה ואוטונומיה — בעברית ובאנגלית.', body: issueBody(latest, { home: true }) + archive, base: '', number: numberOf(0), date: latest.date, path: '' }));

console.log(`built ${issues.length} issue(s); latest ${latest.date}`);
