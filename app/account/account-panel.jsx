'use client';
import { useEffect, useState } from 'react';
import { authConfigured, getSupabase } from '../../lib/supabase';
import { Bi } from '../bi';

const PROFILE_FIELDS = 'display_name, preferred_lang, daily_email';

export default function AccountPanel() {
  const [session, setSession] = useState(undefined); // undefined = still checking
  useEffect(() => {
    const sb = getSupabase();
    if (!sb) return;
    sb.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = sb.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  if (!authConfigured) {
    return (
      <div className="account">
        <p className="msg"><Bi he="ההרשמה תיפתח בקרוב. התשתית מוכנה באתר, וחסר רק חיבור לשירות החשבונות." en="Sign-up opens soon. The groundwork is in place; only the connection to the accounts service is missing." /></p>
      </div>
    );
  }
  if (session === undefined) return <div className="account"><p className="note"><Bi he="בודק…" en="Checking…" /></p></div>;
  return <div className="account">{session ? <Profile session={session} /> : <SignIn />}</div>;
}

function SignIn() {
  const [email, setEmail] = useState('');
  const [state, setState] = useState('idle'); // idle | sending | sent | error
  async function submit(e) {
    e.preventDefault();
    setState('sending');
    const { error } = await getSupabase().auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: `${window.location.origin}/account` },
    });
    setState(error ? 'error' : 'sent');
  }
  if (state === 'sent') {
    return <p className="msg"><Bi he="שלחנו קישור כניסה למייל. פתחו אותו מהמכשיר הזה. אם זו הפעם הראשונה, החשבון נוצר בלחיצה." en="We sent a sign-in link. Open it on this device. If this is your first time, the account is created when you click it." /></p>;
  }
  return (
    <form onSubmit={submit}>
      <label>
        <Bi he="כתובת מייל" en="Email address" />
        <input type="email" required autoComplete="email" inputMode="email" value={email} onChange={(e) => setEmail(e.target.value)} dir="ltr" />
      </label>
      <button className="primary" type="submit" disabled={state === 'sending'}><Bi he="שלחו לי קישור כניסה" en="Email me a sign-in link" /></button>
      {state === 'error' && <p className="msg err"><Bi he="לא הצלחנו לשלוח. בדקו את הכתובת ונסו שוב." en="We could not send it. Check the address and try again." /></p>}
      <p className="note"><Bi he="נשתמש בכתובת רק להתחברות ולמה שבחרתם בפרופיל." en="We use the address only for signing in and for what you choose in your profile." /></p>
    </form>
  );
}

function Profile({ session }) {
  const sb = getSupabase();
  const uid = session.user.id;
  const [form, setForm] = useState({ display_name: '', preferred_lang: 'he', daily_email: false });
  const [state, setState] = useState('loading'); // loading | idle | saving | saved | error
  useEffect(() => {
    sb.from('profiles').select(PROFILE_FIELDS).eq('id', uid).maybeSingle().then(({ data, error }) => {
      if (error) return setState('error');
      if (data) setForm({ display_name: data.display_name ?? '', preferred_lang: data.preferred_lang ?? 'he', daily_email: Boolean(data.daily_email) });
      setState('idle');
    });
  }, [sb, uid]);
  async function save(e) {
    e.preventDefault();
    setState('saving');
    const { error } = await sb.from('profiles').upsert({ id: uid, ...form, display_name: form.display_name.trim() || null });
    setState(error ? 'error' : 'saved');
  }
  return (
    <form onSubmit={save}>
      <p className="note"><Bi he="מחובר/ת כ" en="Signed in as" /> <bdi dir="ltr">{session.user.email}</bdi></p>
      <label>
        <Bi he="שם תצוגה" en="Display name" />
        <input type="text" maxLength={60} value={form.display_name} onChange={(e) => setForm({ ...form, display_name: e.target.value })} />
      </label>
      <label>
        <Bi he="שפה מועדפת" en="Preferred language" />
        <select value={form.preferred_lang} onChange={(e) => setForm({ ...form, preferred_lang: e.target.value })}>
          <option value="he">עברית</option>
          <option value="en">English</option>
        </select>
      </label>
      <label className="check">
        <input type="checkbox" checked={form.daily_email} onChange={(e) => setForm({ ...form, daily_email: e.target.checked })} />
        <Bi he="שלחו לי את הגיליון היומי במייל" en="Email me the daily issue" />
      </label>
      <button className="primary" type="submit" disabled={state === 'loading' || state === 'saving'}><Bi he="שמירה" en="Save" /></button>
      {state === 'saved' && <p className="msg"><Bi he="נשמר." en="Saved." /></p>}
      {state === 'error' && <p className="msg err"><Bi he="הפעולה נכשלה. נסו שוב מאוחר יותר." en="That did not work. Try again later." /></p>}
      <button className="ghost" type="button" onClick={() => sb.auth.signOut()}><Bi he="יציאה" en="Sign out" /></button>
    </form>
  );
}
