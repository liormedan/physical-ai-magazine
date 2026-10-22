'use client';
import { useEffect } from 'react';

// Wires the masthead's #lang button; the initial language is set by the
// inline script in layout.jsx before paint.
export default function LangToggle() {
  useEffect(() => {
    const d = document.documentElement;
    const onClick = (e) => {
      if (!e.target.closest('#lang')) return;
      const v = d.getAttribute('data-lang') === 'he' ? 'en' : 'he';
      d.setAttribute('lang', v);
      d.setAttribute('dir', v === 'he' ? 'rtl' : 'ltr');
      d.setAttribute('data-lang', v);
      try { localStorage.setItem('pam-lang', v); } catch {}
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);
  return null;
}
