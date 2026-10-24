// Both languages are always in the DOM; CSS shows the one in html[data-lang].
// Kept apart from components.jsx so client components can use it without
// pulling in server-only code.
export function Bi({ he, en, as: Tag = 'span', className }) {
  return (
    <>
      <Tag className={className} lang="he" dir="rtl" data-l="he">{he}</Tag>
      <Tag className={className} lang="en" dir="ltr" data-l="en">{en}</Tag>
    </>
  );
}
