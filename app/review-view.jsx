import { SECTIONS, CATEGORIES, fmtDate } from '../lib/issues';
import { catIcon } from '../lib/graphics';
import { Bi, Linked } from './components';

const paras = (text) => text.split(/\n\s*\n/).map((t) => t.trim()).filter(Boolean);

function Paras({ he, en, className }) {
  const h = paras(he);
  const e = paras(en);
  return (
    <>
      <div className={className} lang="he" dir="rtl" data-l="he">{h.map((t, i) => <p key={i}><Linked text={t} /></p>)}</div>
      <div className={className} lang="en" dir="ltr" data-l="en">{e.map((t, i) => <p key={i}><Linked text={t} /></p>)}</div>
    </>
  );
}

function ReviewItem({ it }) {
  const c = CATEGORIES[it.category];
  return (
    <article className="ritem">
      <div className="cat"><span className="svg" aria-hidden="true" dangerouslySetInnerHTML={{ __html: catIcon(it.category) }} /><Bi he={c.he} en={c.en} /> · <span className="when"><Bi he={fmtDate(it.date, 'he-IL')} en={fmtDate(it.date, 'en-US')} /></span></div>
      <div className="body">
        <h3><Bi he={<Linked text={it.title_he} />} en={<Linked text={it.title_en} />} /></h3>
        <p className="sum"><Bi he={<Linked text={it.summary_he} />} en={<Linked text={it.summary_en} />} /></p>
        <p className="why"><Bi he={<>למה זה חשוב: <Linked text={it.why_he} /></>} en={<>Why it matters: <Linked text={it.why_en} /></>} /></p>
        <div className="src"><Bi he="מקור" en="Source" />: <a href={it.source_url} rel="noopener" target="_blank">{it.source_name}</a></div>
      </div>
    </article>
  );
}

export function ReviewView({ review }) {
  return (
    <div className="review">
      <div className="issue-head">
        <p className="kicker"><Bi he="סיכום חודשי" en="Monthly review" /> · <Bi he={`${fmtDate(review.period_from, 'he-IL')} עד ${fmtDate(review.period_to, 'he-IL')}`} en={`${fmtDate(review.period_from, 'en-US')} to ${fmtDate(review.period_to, 'en-US')}`} /></p>
        <h1><Bi he={review.headline_he} en={review.headline_en} /></h1>
        <Paras he={review.intro_he} en={review.intro_en} className="intro prose" />
      </div>

      <section className="numbers" aria-label="numbers">
        <p className="kicker"><Bi he="מספרי החודש" en="Numbers of the month" /></p>
        <div className="num-grid">
          {review.numbers.map((n, i) => (
            <div className="num" key={i}>
              <span className="big mono">{n.value}</span>
              <span className="lbl"><Bi he={<Linked text={n.label_he} />} en={<Linked text={n.label_en} />} /></span>
              <a className="src" href={n.source_url} rel="noopener" target="_blank">{n.source_name}</a>
            </div>
          ))}
        </div>
      </section>

      {review.sections.map((s) => (
        <section className="rsection" key={s.key} id={s.key}>
          <h2><Bi he={SECTIONS[s.key].he} en={SECTIONS[s.key].en} /></h2>
          <Paras he={s.lead_he} en={s.lead_en} className="lead-text prose" />
          <div className="stories">{s.items.map((it, i) => <ReviewItem key={i} it={it} />)}</div>
        </section>
      ))}

      <section className="rsection watch">
        <h2><Bi he="מה לעקוב אחריו בחודש הקרוב" en="What to watch next month" /></h2>
        <ul>
          {review.watch_he.map((t, i) => (
            <li key={i}><Bi he={<Linked text={t} />} en={<Linked text={review.watch_en[i]} />} /></li>
          ))}
        </ul>
      </section>
    </div>
  );
}
