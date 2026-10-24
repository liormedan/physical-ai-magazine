import Link from 'next/link';
import { CATEGORIES, SECTIONS, EDITIONS, fmtDate } from '../lib/issues';
import { coverSvg, catIcon } from '../lib/graphics';
import { linkParts } from '../lib/entities';

// Both languages are always in the DOM; CSS shows the one in html[data-lang].
export function Bi({ he, en, as: Tag = 'span', className }) {
  return (
    <>
      <Tag className={className} lang="he" dir="rtl" data-l="he">{he}</Tag>
      <Tag className={className} lang="en" dir="ltr" data-l="en">{en}</Tag>
    </>
  );
}

// Text with every known company or project name underlined and linked to its site.
export function Linked({ text }) {
  return linkParts(text).map((p, i) => typeof p === 'string'
    ? p
    : <a key={i} className="ent" href={p.url} rel="noopener" target="_blank">{p.name}</a>);
}

const Svg = ({ html }) => <span className="svg" aria-hidden="true" dangerouslySetInnerHTML={{ __html: html }} />;
const pad = (n) => String(n).padStart(2, '0');

export function Tabs({ active }) {
  const tabs = [['', 'הגיליון', 'Today'], ...Object.entries(SECTIONS).map(([k, s]) => [k, s.he, s.en]), ['market', 'שוק', 'Market']];
  return (
    <nav className="tabs" aria-label="sections">
      {tabs.map(([k, he, en]) => (
        <Link key={k || 'home'} href={`/${k}`} className={active === k ? 'on' : undefined} aria-current={active === k ? 'page' : undefined}>
          <Bi he={he} en={en} />
        </Link>
      ))}
    </nav>
  );
}

export function Masthead({ issue, active = '' }) {
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
        <Tabs active={active} />
      </header>
    </div>
  );
}

function EditionTag({ edition }) {
  if (!edition || edition === 'morning') return null;
  const e = EDITIONS[edition];
  return <span className="edition"><Bi he={`עדכון ${e.he} · ${e.time}`} en={`${e.en} update · ${e.time}`} /></span>;
}

function Story({ it, i, lead }) {
  const c = CATEGORIES[it.category];
  return (
    <article id={`s${i + 1}`} className={lead ? 'lead' : undefined}>
      <div className="cat"><Svg html={catIcon(it.category)} /><span className="n">{pad(i + 1)}</span><Bi he={c.he} en={c.en} /></div>
      <div className="body">
        <EditionTag edition={it.edition} />
        <h2><Bi he={<Linked text={it.title_he} />} en={<Linked text={it.title_en} />} /></h2>
        <p className="sum"><Bi he={<Linked text={it.summary_he} />} en={<Linked text={it.summary_en} />} /></p>
        {it.why_he && <p className="why"><Bi he={<>למה זה חשוב: <Linked text={it.why_he} /></>} en={<>Why it matters: <Linked text={it.why_en} /></>} /></p>}
        <div className="src"><Bi he="מקור" en="Source" />: <a href={it.source_url} rel="noopener" target="_blank">{it.source_name}</a></div>
      </div>
    </article>
  );
}

// A YouTube player whose playlist is the curated list in data/videos.json.
// youtube-nocookie keeps YouTube from setting cookies until a reader presses play.
export function VideoRail({ videos }) {
  if (!videos?.length) return null;
  const [first, ...rest] = videos;
  const src = `https://www.youtube-nocookie.com/embed/${first.id}?rel=0&playlist=${rest.map((v) => v.id).join(',')}`;
  return (
    <section className="video" aria-label="video">
      <p className="kicker"><Bi he="וידאו מהתחום" en="Video from the field" /></p>
      <div className="frame">
        <iframe src={src} title="Physical AI videos" loading="lazy" referrerPolicy="strict-origin-when-cross-origin"
          allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen" allowFullScreen />
      </div>
      <ol>
        {videos.map((v) => (
          <li key={v.id}>
            <a href={`https://www.youtube.com/watch?v=${v.id}`} rel="noopener" target="_blank">{v.title}</a>
            {(v.note_he || v.note_en) && <p className="note"><Bi he={v.note_he} en={v.note_en} /></p>}
            <span className="src">{v.channel} · {v.published}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function Issue({ issue, home, videos }) {
  const [lead, ...rest] = issue.items;
  return (
    <div className="front">
      <div>
        <div className="issue-head">
        <p className="kicker">
          <Bi he={home ? 'הגיליון האחרון' : 'מהארכיון'} en={home ? 'Latest issue' : 'From the archive'} />
          {issue.updated && issue.updated !== 'morning' && (
            <span className="updated"> · <Bi he={`עודכן ב-${EDITIONS[issue.updated].time}`} en={`Updated ${EDITIONS[issue.updated].time}`} /></span>
          )}
        </p>
          <h1><Bi he={issue.headline_he} en={issue.headline_en} /></h1>
          <p className="intro"><Bi he={issue.intro_he} en={issue.intro_en} /></p>
        </div>
        <Svg html={coverSvg(issue)} />
        <div className="lead-row">
          <Story it={lead} i={0} lead />
          {rest[0] && <Story it={rest[0]} i={1} />}
        </div>
        <div className="stories">
          {rest.slice(1).map((it, i) => <Story key={i} it={it} i={i + 2} />)}
        </div>
      </div>
      <aside className="rail">
        <div>
          <nav className="toc" aria-label="contents">
            <p className="kicker"><Bi he="בגיליון הזה" en="In this issue" /></p>
            <ol>
              {issue.items.map((it, i) => (
                <li key={i}><a href={`#s${i + 1}`}><span className="n">{pad(i + 1)}</span><Bi he={it.title_he} en={it.title_en} /></a></li>
              ))}
            </ol>
          </nav>
          <VideoRail videos={videos} />
        </div>
      </aside>
    </div>
  );
}

// A tab page: every item of the section across issues, newest first, linking back to its issue.
export function SectionList({ items }) {
  if (!items.length) return <p className="intro"><Bi he="עוד אין כתבות בלשונית הזו." en="No stories in this section yet." /></p>;
  return (
    <div className="stories">
      {items.map((it) => {
        const c = CATEGORIES[it.category];
        return (
          <article key={`${it.date}-${it.anchor}`}>
            <div className="cat"><Svg html={catIcon(it.category)} /><Bi he={c.he} en={c.en} /></div>
            <div className="body">
              <EditionTag edition={it.edition} />
              <h2><Link href={`/issues/${it.date}#${it.anchor}`}><Bi he={it.title_he} en={it.title_en} /></Link></h2>
              <p className="sum"><Bi he={<Linked text={it.summary_he} />} en={<Linked text={it.summary_en} />} /></p>
              <div className="src">
                <Bi he={fmtDate(it.date, 'he-IL')} en={fmtDate(it.date, 'en-US')} /> · <Bi he="מקור" en="Source" />: <a href={it.source_url} rel="noopener" target="_blank">{it.source_name}</a>
              </div>
            </div>
          </article>
        );
      })}
    </div>
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
