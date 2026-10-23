import { getIssues } from '../lib/issues';
import { getVideos } from '../lib/videos';
import { Masthead, Issue, Archive } from './components';

export default function Home() {
  const [latest, ...older] = getIssues();
  return (
    <>
      <Masthead issue={latest} />
      <main className="wrap">
        <Issue issue={latest} home videos={getVideos()} />
        <Archive issues={older} />
      </main>
    </>
  );
}
