import { getIssues } from '../../lib/issues';
import { getVideos } from '../../lib/videos';
import { Masthead, Bi, Linked, VideoRail } from '../components';

export const metadata = {
  title: 'וידאו | Video — מגזין פיזיקל AI',
  alternates: { canonical: '/videos' },
};

export default function VideosPage() {
  const [latest] = getIssues();
  const videos = getVideos();
  return (
    <>
      <Masthead issue={latest} active="videos" />
      <main className="wrap">
        <div className="issue-head">
          <p className="kicker"><Bi he="לשונית" en="Section" /></p>
          <h1><Bi he="וידאו" en="Video" /></h1>
          <p className="intro">
            <Bi he="נגן עם פלייליסט שמתעדכן בסרטונים חדשים מהתחום: הדגמות, ראיונות והרצאות. כל סרטון עם שם הערוץ ותאריך הפרסום."
              en="A player with a playlist refreshed with new videos from the field: demos, interviews and talks. Each video shows its channel and publication date." />
          </p>
        </div>
        {videos.length ? <VideoRail videos={videos} page /> : <p className="intro"><Bi he="אין עדיין סרטונים." en="No videos yet." /></p>}
      </main>
    </>
  );
}
