'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getSupabase } from '../lib/supabase';
import { Bi } from './bi';

// Header button: "Sign up / in" when signed out, "My account" when signed in.
export default function AccountLink({ active }) {
  const [signedIn, setSignedIn] = useState(false);
  useEffect(() => {
    const sb = getSupabase();
    if (!sb) return;
    sb.auth.getSession().then(({ data }) => setSignedIn(Boolean(data.session)));
    const { data } = sb.auth.onAuthStateChange((_e, session) => setSignedIn(Boolean(session)));
    return () => data.subscription.unsubscribe();
  }, []);
  return (
    <Link href="/account" className={`acct${signedIn ? ' in' : ''}`} aria-current={active ? 'page' : undefined}>
      {signedIn ? <Bi he="החשבון שלי" en="My account" /> : <Bi he="הרשמה · כניסה" en="Sign up · Sign in" />}
    </Link>
  );
}
