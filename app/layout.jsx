import { Frank_Ruhl_Libre, Heebo } from 'next/font/google';
import { SITE_URL } from '../lib/issues';
import { Bi } from './components';
import LangToggle from './lang-toggle';
import './globals.css';

const serif = Frank_Ruhl_Libre({ subsets: ['hebrew', 'latin'], weight: ['400', '500'], variable: '--font-serif', display: 'swap' });
const sans = Heebo({ subsets: ['hebrew', 'latin'], weight: ['400', '500', '600'], variable: '--font-sans', display: 'swap' });

export const metadata = {
  metadataBase: new URL(SITE_URL),
  title: 'מגזין פיזיקל AI | Physical AI Magazine',
  description: 'יומן יומי של בינה גופנית, רובוטיקה ואוטונומיה — בעברית ובאנגלית.',
  openGraph: {
    siteName: 'מגזין פיזיקל AI | Physical AI Magazine',
    locale: 'he_IL',
    alternateLocale: ['en_US'],
    images: [{ url: '/og.png', width: 1200, height: 630, alt: 'מגזין פיזיקל AI — שרטוט קווי של זרוע רובוטית על נייר' }],
  },
  twitter: { card: 'summary_large_image', images: ['/og.png'] },
};

// Runs before paint so a reader who chose English never sees a Hebrew flash.
const langScript = `(function(){var d=document.documentElement,l='he';
try{l=localStorage.getItem('pam-lang')||((navigator.language||'').indexOf('he')===0?'he':'en')}catch(e){}
d.setAttribute('lang',l);d.setAttribute('dir',l==='he'?'rtl':'ltr');d.setAttribute('data-lang',l);})();`;

export default function RootLayout({ children }) {
  return (
    <html lang="he" dir="rtl" data-lang="he" className={`${serif.variable} ${sans.variable}`} suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: langScript }} /></head>
      <body>
        {children}
        <footer className="wrap">
          <Bi as="p"
            he="המגזין נכתב ומתורגם אוטומטית על ידי סוכן בינה מלאכותית ממקורות ציבוריים. כל פריט מקשר למקור. ייתכנו טעויות — בדקו במקור."
            en="This magazine is written and translated automatically by an AI agent from public sources. Every item links to its source. Errors are possible — verify at the source." />
        </footer>
        <LangToggle />
      </body>
    </html>
  );
}
