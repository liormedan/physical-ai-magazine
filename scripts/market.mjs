// Refreshes data/market.json: last price, daily and one-month change for the
// basket in newsroom/market-basket.json, plus an equal-weighted index of the
// companies (funds excluded). Run at 07:00, 13:00 and 19:00 with the editions.
//
// Source: Yahoo Finance's public chart endpoint (no key). It is unofficial and
// its terms do not cover redistribution; swap `quote()` for a licensed API
// (Alpha Vantage, Financial Modeling Prep…) before relying on it publicly.
// Usage: node scripts/market.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const { tickers } = JSON.parse(readFileSync(join(root, 'newsroom', 'market-basket.json'), 'utf8'));
const SOURCE = { name: 'Yahoo Finance', url: 'https://finance.yahoo.com' };

async function quote(symbol) {
  const res = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=1mo&interval=1d`, {
    headers: { 'user-agent': 'Mozilla/5.0 (physical-ai-magazine market page)' },
    signal: AbortSignal.timeout(15000),
  });
  const chart = (await res.json()).chart;
  if (chart.error || !chart.result?.[0]) throw new Error(chart.error?.description ?? `HTTP ${res.status}`);
  const r = chart.result[0];
  const closes = r.indicators.quote[0].close.filter((x) => x != null);
  const price = r.meta.regularMarketPrice;
  const prev = closes.length >= 2 ? closes.at(-2) : r.meta.chartPreviousClose;
  const pct = (a, b) => (b ? Math.round(((a - b) / b) * 10000) / 100 : null);
  return {
    price: Math.round(price * 100) / 100,
    currency: r.meta.currency,
    changePct: pct(price, prev),
    change1mPct: pct(price, closes[0]),
    asOf: new Date(r.meta.regularMarketTime * 1000).toISOString(),
  };
}

const rows = [];
const misses = [];
for (const t of tickers) {
  try { rows.push({ ...t, ...(await quote(t.symbol)) }); }
  catch (e) { misses.push(`${t.symbol}: ${e.message}`); }
}
if (rows.length < tickers.length / 2) {
  console.error(`too few quotes (${rows.length}/${tickers.length}); data/market.json left unchanged. ${misses.join('; ')}`);
  process.exit(1);
}

const companies = rows.filter((r) => r.group !== 'fund');
const avg = (k) => {
  const v = companies.map((r) => r[k]).filter((x) => x != null);
  return v.length ? Math.round((v.reduce((a, b) => a + b, 0) / v.length) * 100) / 100 : null;
};
const out = {
  updated: new Date().toISOString(),
  source: SOURCE,
  index: { name_he: 'מדד הבינה הגופנית', name_en: 'Physical AI index', method: 'equal-weighted average of the companies, funds excluded', changePct: avg('changePct'), change1mPct: avg('change1mPct') },
  tickers: rows,
  misses,
};
writeFileSync(join(root, 'data', 'market.json'), JSON.stringify(out, null, 2) + '\n');
console.log(`market: ${rows.length}/${tickers.length} quotes; index ${out.index.changePct}% today, ${out.index.change1mPct}% 1M${misses.length ? `; missing ${misses.join('; ')}` : ''}`);
