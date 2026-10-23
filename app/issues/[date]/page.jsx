import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getIssues, getIssue } from '../../../lib/issues';
import { getVideos } from '../../../lib/videos';
import { Masthead, Issue, Bi } from '../../components';

export const dynamicParams = false;

export function generateStaticParams() {
  return getIssues().map((i) => ({ date: i.date }));
}

export async function generateMetadata({ params }) {
  const issue = getIssue((await params).date);
  if (!issue) return {};
  const title = `${issue.headline_he} | ${issue.headline_en}`;
  return {
    title,
    description: issue.intro_he,
    alternates: { canonical: `/issues/${issue.date}` },
    openGraph: { type: 'article', title, description: issue.intro_he, url: `/issues/${issue.date}` },
  };
}

export default async function IssuePage({ params }) {
  const issue = getIssue((await params).date);
  if (!issue) notFound();
  return (
    <>
      <Masthead issue={issue} />
      <main className="wrap">
        <Issue issue={issue} videos={getVideos()} />
        <Link className="back" href="/"><Bi he="← לכל הגיליונות" en="← All issues" /></Link>
      </main>
    </>
  );
}
