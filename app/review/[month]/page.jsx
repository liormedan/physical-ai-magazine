import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getIssues } from '../../../lib/issues';
import { getReviews, getReview } from '../../../lib/reviews';
import { Masthead } from '../../components';
import { ReviewView } from '../../review-view';

export const dynamicParams = false;

export function generateStaticParams() {
  const r = getReviews();
  return r.length ? r.map((x) => ({ month: x.month })) : [{ month: 'none' }];
}

export async function generateMetadata({ params }) {
  const r = getReview((await params).month);
  if (!r) return {};
  const title = `${r.headline_he} | ${r.headline_en}`;
  return {
    title,
    description: r.intro_he.split(/\n\s*\n/)[0],
    alternates: { canonical: `/review/${r.month}` },
    openGraph: { type: 'article', title, url: `/review/${r.month}` },
  };
}

export default async function ReviewPage({ params }) {
  const r = getReview((await params).month);
  if (!r) notFound();
  const [latest] = getIssues();
  const others = getReviews().filter((x) => x.month !== r.month);
  return (
    <>
      <Masthead issue={latest} active="review" />
      <main className="wrap">
        <ReviewView review={r} />
        {others.length > 0 && (
          <p className="back">{others.map((x) => <Link key={x.month} href={`/review/${x.month}`}>{x.month} </Link>)}</p>
        )}
      </main>
    </>
  );
}
