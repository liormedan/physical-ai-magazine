# Competitor research — October 2026

Researched 2026-10-23 by a research agent; pages fetched that day. "secondary" = from search snippets; "UNVERIFIED" = could not confirm. Agent-facing reference: the Editor-in-Chief and Brand & Design use it when proposing formats; the adoption plan is in `ROADMAP.md`.

## Comparison

| Publication | Type | Cadence | Core topics | Revenue | Audience (public) |
|---|---|---|---|---|---|
| [The Robot Report](https://www.therobotreport.com/) | US trade | daily site; monthly funding report | industrial/service robots, humanoids, funding | events (Robotics Summit, RoboBusiness), webinars, gated reports, lead gen, ads | 46.5–59K newsletter, 214–345K pageviews/mo (dated, secondary) |
| [IEEE Spectrum Robotics](https://spectrum.ieee.org/topic/robotics/) | engineering trade | weekly "Video Friday"; biweekly newsletter | research, humanoids, drones | membership, ads | n/a |
| [Robotics 24/7](https://www.robotics247.com/) | trade (logistics) | daily; monthly podcast | warehouse, manufacturing, AMR | webinars, white papers, research store, event | n/a |
| [Humanoids Daily / Humanoid Hub](https://www.humanoidsdaily.com/) | niche news + community | several/day; weekly email; conference | humanoids, physical AI, China; "Physical AI Dictionary", company registry | sponsors, sponsored hub, event partnerships, conference | n/a |
| [Humanoid Press](https://humanoid.press/) | niche tracker | irregular news; weekly + monthly roundup | robot tracker, deployment tracker, database, rankings | supplier sponsors, directory | n/a |
| [The Batch](https://www.deeplearning.ai/the-batch/) | AI newsletter | weekly, numbered | broad AI + editor's letter | course funnel | n/a |
| [Import AI](https://importai.substack.com/) | AI newsletter | weekly | research-paper analysis | Substack paid tier | n/a |
| [TLDR AI](https://advertise.tldr.tech/) | AI digest | daily | links + short summaries | native ads: primary (logo, 100 words), secondary (50), quick link (30); max 3/issue; custom pricing | ~1.15M subs, 47% open rate |
| The Information | investor media | daily | scoops, deals, valuations | $399/yr, Pro $749/yr (secondary), events | n/a |
| [CB Insights](https://www.cbinsights.com/research/humanoid-robots-market-map/) | analyst/data | ad hoc + quarterly | market maps, venture data | enterprise SaaS; free maps as lead magnets | n/a |
| [Geektime](https://www.geektime.co.il/) | Israeli tech, Hebrew | daily + flash | AI, funding, cyber; **no robotics category** | sponsored hubs, promoted posts, job board, events | n/a |
| [CTech / Calcalist](https://www.calcalistech.com/ctechnews) | Israeli business tech, English | daily | startups, VC, AI, defense; robotics only via defense/drones | ads, sponsored projects, annual lists, events | n/a |
| [Globes](https://www.globes.co.il/) | Israeli business, Hebrew | daily | M&A, finance; no robotics visible | subscription, marketing content, conferences | n/a |
| [Techtime](https://techtime.co.il/) | Israeli B2B electronics | weekdays | chips, drones, defense, automotive; occasional robotics | media kit ads, sponsored section, jobs, events | n/a |
| [Don't Panic (Eyal Marcus)](https://eyalmarcus.com/ai-newsletter/) | Hebrew AI newsletter | weekly | AI tools for managers; no robotics | courses, lectures, consulting | n/a |

No Hebrew publication focused on robotics or Physical AI was found.

## Gaps we can own
1. **Hebrew Physical AI** — nobody covers VLA, world models, humanoids or robotics chips as a Hebrew beat.
2. **Israel's robotics ecosystem as one map** — today only defense stories (XTEND, Elbit) or one-off funding.
3. **A daily, verified, sourced brief** — TLDR is daily but shallow; trade sites are press-release driven; analysis is weekly.
4. **An investor lens below $399/yr** — open monthly funding table with an Israel column.
5. **Hardware + models + deployment in one read**, including China.
6. **Bilingual by design** — the Israeli angle reaches international investors in English.

## Formats worth adopting
| Format | Seen at | Owner in our newsroom |
|---|---|---|
| "Why it matters" line on every item | TLDR, The Batch | Reporter (draft), Editor-in-Chief |
| Weekly Physical AI funding table with an Israel column | Robot Report, Automate.org | new: Deals tracker; Fact-checker verifies each row |
| Monthly Top 10 + month in numbers | Robot Report, Humanoid Press | Editor-in-Chief |
| Number of the week | The Batch | Reporter + Fact-checker |
| Bilingual glossary (VLA, sim-to-real, teleoperation data…) | Humanoids Daily dictionary | Language editor |
| Israel robotics ecosystem map, quarterly | CB Insights market map | Deals tracker + Brand & Design |
| Video of the week with a technical breakdown (embed only) | IEEE Video Friday | Reporter |
| One paper explained per week | Import AI | Reporter; Fact-checker against the paper |
| Pilot vs. production reality check | Humanoid Press deployment tracker | Fact-checker |
| Interviews with Israeli founders/researchers | Humanoids Daily | Editor-in-Chief; outreach needs Lior |

## Site features worth adopting
- Source block per item (primary link, date, "verified by"), `NewsArticle` structured data.
- Company / robot entity pages collecting every story and deal (SEO moat).
- Public deals database, CSV export behind email signup.
- `hreflang` and stable Hebrew/English URL pairs.
- Newsletter: daily brief + weekly edition, Hebrew and English.
- Sponsor-slot component built early, left empty until there are readers.
- Shareable chart/funding cards for LinkedIn and X.
- "How we work" (AI disclosure), corrections page and correction log.

## Monetization path
| Stage | What | Who |
|---|---|---|
| 0–1K readers | No ads. Daily brief, weekly deals table, glossary, ecosystem map as lead magnet; LinkedIn cards; target 45%+ open rate | Growth & Newsletter, Editor-in-Chief |
| 1K–10K | One sponsor per issue at a flat weekly price (Israeli robotics/AI vendors, VCs, Nvidia Israel); event media partnerships; paid job listings; optional supporter tier | Growth & Newsletter; sales by Lior |
| 10K+ | Tiered slots (TLDR style); "Pro": full deals database + quarterly Israel report at 20–50% of The Information's price; labelled sponsored reports; webinars | Publisher, Deals tracker, Editor-in-Chief; sales by Lior |

Never undisclosed "promoted" articles (the Geektime/Calcalist pattern).

## Risks
| Risk | Mitigation |
|---|---|
| Copyright of summaries | facts in our own words, ≤1 short quote, always link; never rebuild paywalled text; embed, never re-host video |
| Trust in AI-written news; EU AI Act transparency | "how we work" page, human-approval line, public correction log, "verified against primary source" flag |
| Wrong numbers in the deals table | every row needs a primary source + a second source, else "unconfirmed"; publish the methodology (trackers differ: Dealroom $11B YTD vs another $5.3B) |
| Sponsor conflicts | label every paid item; sponsors never touch the deals data; publish an ad policy |
| Defamation (negative stories on named Israeli companies) | human review before publishing such stories |
| Single-operator bottleneck | buffer of evergreen explainers; the weekly table is the minimum commitment |
| Platform/SEO dependence | owned assets: email list, entity pages, database |

## Could not verify
Audience numbers for most outlets; ad prices for TLDR, Robot Report, Robotics 24/7; Globes price; Stratechery and CB Insights pricing; The Robot Report site and Israel Hayom tech returned 403.
