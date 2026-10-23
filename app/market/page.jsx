import Link from 'next/link';
import { getIssues } from '../../lib/issues';
import { getMarket } from '../../lib/market';
import { Masthead, Bi } from '../components';

export const metadata = {
  title: 'שוק | Market — מגזין פיזיקל AI',
  alternates: { canonical: '/market' },
};

const pct = (v) => (v == null ? '—' : `${v > 0 ? '+' : ''}${v.toFixed(2)}%`);
const dir = (v) => (v == null ? '' : v > 0 ? 'up' : v < 0 ? 'down' : '');
const fmtTime = (iso, loc) => new Date(iso).toLocaleString(loc, { timeZone: 'Asia/Jerusalem', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

export default function MarketPage() {
  const [latest] = getIssues();
  const m = getMarket();
  return (
    <>
      <Masthead issue={latest} active="market" />
      <main className="wrap">
        <div className="issue-head">
          <p className="kicker"><Bi he="לשונית" en="Section" /></p>
          <h1><Bi he="שוק" en="Market" /></h1>
          <p className="intro">
            <Bi he="החברות הציבוריות וקרנות הסל של הבינה הגופנית: מחיר אחרון, שינוי יומי ושינוי חודשי, וליד כל חברה הכתבות שלנו עליה."
              en="Public companies and funds in Physical AI: last price, daily and one-month change, and our stories on each company." />
          </p>
        </div>
        {!m ? <p className="intro"><Bi he="אין עדיין נתונים." en="No data yet." /></p> : (
          <>
            <div className="index-card">
              <p className="kicker"><Bi he={m.index.name_he} en={m.index.name_en} /></p>
              <div className="index-nums">
                <span className={`big ${dir(m.index.changePct)}`}>{pct(m.index.changePct)}</span>
                <span className="lbl"><Bi he="היום" en="today" /></span>
                <span className={`big ${dir(m.index.change1mPct)}`}>{pct(m.index.change1mPct)}</span>
                <span className="lbl"><Bi he="חודש" en="1 month" /></span>
              </div>
              <p className="src"><Bi he="ממוצע שווה-משקל של החברות, בלי קרנות הסל." en="Equal-weighted average of the companies, funds excluded." /></p>
            </div>
            <div className="table-wrap">
              <table className="market">
                <thead>
                  <tr>
                    <th><Bi he="חברה" en="Company" /></th>
                    <th><Bi he="סימול" en="Symbol" /></th>
                    <th className="num-col"><Bi he="מחיר" en="Price" /></th>
                    <th className="num-col"><Bi he="היום" en="Today" /></th>
                    <th className="num-col"><Bi he="חודש" en="1M" /></th>
                    <th><Bi he="אצלנו" en="Our coverage" /></th>
                  </tr>
                </thead>
                <tbody>
                  {m.tickers.map((t) => (
                    <tr key={t.symbol}>
                      <td>{t.name}{t.israel && <span className="tag"><Bi he="ישראל" en="Israel" /></span>}</td>
                      <td className="mono">{t.symbol}</td>
                      <td className="num-col mono">{t.price.toLocaleString('en-US')} {t.currency}</td>
                      <td className={`num-col mono ${dir(t.changePct)}`}>{pct(t.changePct)}</td>
                      <td className={`num-col mono ${dir(t.change1mPct)}`}>{pct(t.change1mPct)}</td>
                      <td className="cov">
                        {t.stories.length === 0 ? <span className="src">—</span> : t.stories.map((s) => (
                          <Link key={`${s.date}-${s.anchor}`} href={`/issues/${s.date}#${s.anchor}`}><Bi he={s.title_he} en={s.title_en} /></Link>
                        ))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="src disclaimer">
              <Bi he={`הנתונים מ-${m.source.name}, נכון ל-${fmtTime(m.updated, 'he-IL')} (שעון ישראל); מתעדכנים שלוש פעמים ביום וייתכן עיכוב. מוצגים לצורכי מידע בלבד — זה לא ייעוץ השקעות ולא המלצה לקנות או למכור.`}
                en={`Data from ${m.source.name}, as of ${fmtTime(m.updated, 'en-GB')} (Israel time); refreshed three times a day and may be delayed. For information only — not investment advice or a recommendation to buy or sell.`} />
            </p>
          </>
        )}
      </main>
    </>
  );
}
