# Accounts and profiles — groundwork

Status: the site side is built and works without a backend (the account page says "opens soon"). Turning it on takes one Supabase project and two environment variables.

## What exists
- **Pinned top bar** (`.topbar` in `app/components.jsx`): section tabs, account button and language switch stay at the top of the window while reading. The large masthead still scrolls away.
- **`/account`** (`app/account/`): email sign-in with a magic link (no passwords to store or leak; the first sign-in creates the account), then a profile form: display name, preferred language, "email me the daily issue".
- **Header button** (`app/account-link.jsx`): "Sign up · Sign in" or "My account".
- **`lib/supabase.js`**: browser client, active only when the two variables below are set.
- **`supabase/migrations/0001_profiles.sql`**: `profiles` table, row level security (each user sees and edits only their own row), automatic profile on sign-up.
- **`.env.example`**: the two variables.

## To turn it on (needs the owner)
1. Create a Supabase project (supabase.com). Choose the region; EU is the usual choice for Israeli and European readers.
2. In the SQL editor run `supabase/migrations/0001_profiles.sql`.
3. Authentication, URL configuration: set the Site URL to `https://physical-ai-magazine.vercel.app` and add `https://physical-ai-magazine.vercel.app/account` and `http://localhost:3000/account` to the redirect URLs.
4. Copy the project URL and the anon (publishable) key into the Vercel project's environment variables as `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`, then redeploy.
5. Authentication, SMTP: the built-in mailer is rate-limited and meant for testing; set a real sender (a mail provider) before inviting readers.

## Decisions still open
- **Sign-in methods:** email link only for now. Google or Apple sign-in can be added in the Supabase dashboard plus one button.
- **Privacy:** before collecting addresses, add a privacy notice and consent text (Israeli Privacy Protection Law, GDPR for EU readers) and a delete-my-account action.
- **Daily email:** the `daily_email` flag is only stored. Sending needs a mail provider and a job that runs after publish.
- **Discussions:** Giscus uses GitHub accounts. Moving discussions to these profiles is a separate decision.
- **Agents:** none of the newsroom agents touch accounts or user data.
