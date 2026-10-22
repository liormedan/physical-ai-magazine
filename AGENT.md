# Daily agent instructions — Physical AI Magazine

> Legacy single-agent flow, used by the `physical-ai-magazine-daily` scheduled task until the newsroom team takes over. The team's instructions are in `newsroom/agents/`; see `newsroom/README.md`.

Working directory: `C:\pysical ai magazine`. Goal: publish one new bilingual (Hebrew + English) issue about Physical AI per day.

## Steps
1. Compute today's date with a command (`date +%F`), never from memory. If `data/issues/<date>.json` exists, stop.
2. Read the latest file in `data/issues/` to avoid repeating stories.
3. Search the web (WebSearch, mode extended) for news from the last 48 hours on: humanoid robots, robot foundation models / VLA / world models, robot manipulation and dexterity, autonomous vehicles and drones, robotics chips and hardware, industrial deployments and funding. Prefer primary sources (company blogs, papers, Reuters, The Robot Report, IEEE Spectrum, Forbes, Interesting Engineering). Open at least the key article with WebFetch before reporting numbers.
4. Pick 5-8 items. Each must have a real source URL you actually saw. Never invent facts, numbers or quotes. Mark company claims as self-reported ("לפי החברה" / "the company says"). If fewer than 3 real items exist, write fewer and say so in the intro; the build requires at least 3.
5. Write `data/issues/<date>.json` with this schema:
   - `date`, `headline_he`, `headline_en`, `intro_he`, `intro_en`
   - `items[]`: `category` (robotics | humanoids | models | autonomy | hardware | industry | research), `title_he`, `title_en`, `summary_he`, `summary_en` (2-3 sentences, own words, no copied passages), `source_name`, `source_url`
   - Hebrew is natural journalistic Hebrew, not word-for-word. Keep product and company names in Latin letters. English is the faithful translation of the Hebrew.
6. Run `npm run validate` (fast check of the JSON), then `npm run build` (Next.js build). Fix any error and re-run until both succeed. If `node_modules` is missing, run `npm ci` first.
7. Publish: run `npm run publish-issue`. It validates, builds, commits the new issue and pushes to `main`; Vercel is connected to the GitHub repo (liormedan/physical-ai-magazine) and deploys every push to https://physical-ai-magazine.vercel.app. Only publish if the build in step 6 passed. If the push fails, report the error; do not retry in a loop and do not force-push.
8. Report in Hebrew: the issue headline, number of items, whether the build and push passed, and the live URL.
