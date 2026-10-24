import { getIssues } from '../../lib/issues';
import { Masthead, Bi } from '../components';
import AccountPanel from './account-panel';

export const metadata = {
  title: 'חשבון | Account — מגזין פיזיקל AI',
  alternates: { canonical: '/account' },
  robots: { index: false },
};

export default function AccountPage() {
  const [latest] = getIssues();
  return (
    <>
      <Masthead issue={latest} active="account" />
      <main className="wrap">
        <div className="issue-head">
          <p className="kicker"><Bi he="חשבון" en="Account" /></p>
          <h1><Bi he="הרשמה וכניסה" en="Sign up and sign in" /></h1>
          <p className="intro">
            <Bi he="חשבון מאפשר להשתתף בדיונים, לשמור העדפות ולקבל את הגיליון היומי במייל. אין סיסמה: שולחים קישור כניסה לכתובת המייל."
              en="An account lets you join discussions, keep your preferences and get the daily issue by email. There is no password: we email you a sign-in link." />
          </p>
        </div>
        <AccountPanel />
      </main>
    </>
  );
}
