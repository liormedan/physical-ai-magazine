import { getIssues } from '../lib/issues';
import { Masthead, Issue, Archive } from './components';

export default function Home() {
  const [latest, ...older] = getIssues();
  return (
    <>
      <Masthead issue={latest} />
      <main className="wrap">
        <Issue issue={latest} home />
        <Archive issues={older} />
      </main>
    </>
  );
}
