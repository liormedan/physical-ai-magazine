import Link from 'next/link';
import { CATEGORIES, fmtDate } from '../lib/issues';
import { coverSvg, catIcon } from '../lib/graphics';

// Both languages are always in the DOM; CSS shows the one in html[data-lang].
export function Bi({ he, en, as: Tag = 'span', className }) {
  return (
    <>
      <Tag className={className} lang="he" dir="rtl" data-l="he">{he}</Tag>
      <Tag className={className} lang="en" dir="ltr" data-l="en">{en}</Tag>
    </>
  );
}

const Svg = ({ html }) => <span className="svg" aria-hidden="true" dangerouslySetInnerHTML={{ __html: html }} />;
const pad = (n) => String(n).padStart(2, '0');

export function Masthead({ issue }) {
  return (
    <div className="band">
      <header className="wrap mast">
        <div className="meta">
          <span><Bi he={`גיליון ${issue.number}`} en={`Issue No. ${issue.number}`} /></span>
          <button id="lang" type="button" aria-label="Switch language / החלפת שפה">עברית · English</button>
          <span><Bi he={fmtDate(issue.date, 'he-IL')} en={fmtDate(issue.date, 'en-US')} /></span>
        </div>
        <Link className="brand" href="/">
          <Bi he="מגזין פיזיקל AI" en="Physical AI Magazine" />
          <small><Bi he="יומן יומי של בינה גופנית, רובוטיקה ואוטונומיה" en="A daily record of embodied AI, robotics & autonomy" /></small>
        </Link>
      </header>
    </div>
  );
}

export function Issue({ issue, home }) {
  return (
    <>
      <div className="issue-head">
        <p className="kicker"><Bi he={home ? 'הגיליון האחרון' : 'מהארכיון'} en={home ? 'Latest issue' : 'From the archive'} /></p>
        <h1><Bi he={issue.headline_he} en={issue.headline_en} /></h1>
        <p className="intro"><Bi he={issue.intro_he} en={issue.intro_en} /></p>
      </div>
      <Svg html={coverSvg(issue)} />
      <nav className="toc" aria-label="contents">
        <p className="kicker"><Bi he="בגיליון הזה" en="In this issue" /></p>
        <ol>
          {issue.items.map((it, i) => (
            <li key={i}><a href={`#s${i + 1}`}><span className="n">{pad(i + 1)}</span><Bi he={it.title_he} en={it.title_en} /></a></li>
          ))}
        </ol>
      </nav>
      {issue.items.map((it, i) => {
        const c = CATEGORIES[it.category];
        return (
          <article key={i} id={`s${i + 1}`} className={i === 0 ? 'lead' : undefined}>
            <div className="cat"><Svg html={catIcon(it.category)} /><span className="n">{pad(i + 1)}</span><Bi he={c.he} en={c.en} /></div>
            <div className="body">
              <h2><Bi he={it.title_he} en={it.title_en} /></h2>
              <p className="sum"><Bi he={it.summary_he} en={it.summary_en} /></p>
              <div className="src"><Bi he="מקור" en="Source" />: <a href={it.source_url} rel="noopener" target="_blank">{it.source_name}</a></div>
            </div>
          </article>
        );
      })}
    </>
  );
}

export function Archive({ issues }) {
  if (!issues.length) return null;
  return (
    <>
      <h2 className="archive-h"><Bi he="גיליונות קודמים" en="Previous issues" /></h2>
      <ul className="archive">
        {issues.map((it) => (
          <li key={it.date}>
            <span className="num"><Bi he={`גיליון ${it.number}`} en={`No. ${it.number}`} /></span>
            <div>
              <Link href={`/issues/${it.date}`}><Bi he={it.headline_he} en={it.headline_en} /></Link>
              <span className="src"><Bi he={fmtDate(it.date, 'he-IL')} en={fmtDate(it.date, 'en-US')} /></span>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
