import { notFound } from 'next/navigation';
import { getIssues, getSectionItems, SECTIONS } from '../../lib/issues';
import { Masthead, SectionList, Bi } from '../components';

export const dynamicParams = false;

export function generateStaticParams() {
  return Object.keys(SECTIONS).map((section) => ({ section }));
}

export async function generateMetadata({ params }) {
  const s = SECTIONS[(await params).section];
  if (!s) return {};
  const title = `${s.he} | ${s.en} — מגזין פיזיקל AI`;
  return { title, alternates: { canonical: `/${(await params).section}` }, openGraph: { title, url: `/${(await params).section}` } };
}

export default async function SectionPage({ params }) {
  const { section } = await params;
  const s = SECTIONS[section];
  if (!s) notFound();
  const [latest] = getIssues();
  return (
    <>
      <Masthead issue={latest} active={section} />
      <main className="wrap">
        <div className="issue-head">
          <p className="kicker"><Bi he="לשונית" en="Section" /></p>
          <h1><Bi he={s.he} en={s.en} /></h1>
        </div>
        <SectionList items={getSectionItems(section)} />
      </main>
    </>
  );
}
