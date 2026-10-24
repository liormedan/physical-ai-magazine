import { getIssues } from '../../lib/issues';
import { getReviews } from '../../lib/reviews';
import { Masthead, Bi } from '../components';
import { ReviewView } from '../review-view';

export const metadata = {
  title: 'סיכום חודשי | Monthly review — מגזין פיזיקל AI',
  alternates: { canonical: '/review' },
};

export default function ReviewIndex() {
  const [latest] = getIssues();
  const [review] = getReviews();
  return (
    <>
      <Masthead issue={latest} active="review" />
      <main className="wrap">
        {review ? <ReviewView review={review} /> : (
          <div className="issue-head">
            <p className="kicker"><Bi he="לשונית" en="Section" /></p>
            <h1><Bi he="סיכום חודשי" en="Monthly review" /></h1>
            <p className="intro"><Bi he="הסיכום הראשון בדרך." en="The first review is on its way." /></p>
          </div>
        )}
      </main>
    </>
  );
}
