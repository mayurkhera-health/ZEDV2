# AutomateSmall — website

Built to **spec v2**. Static site: no build step, no framework, no package
manager. Open `index.html`, or serve the folder:

```bash
python3 -m http.server 8080
```

## Files

```
index.html                  Home — C1–C12 in order
how-it-works.html           D2 — the five steps expanded, plus engagement
assessment.html             D1 — exactly what the assessment delivers
about.html                  D3 — what AutomateSmall is, who we're for
book.html                   D4 — three questions, then the scheduler
privacy.html / terms.html   Plain-language, with a summary at the top
404.html                    Styled, uses the site's own stylesheet
assets/styles.css           One stylesheet. B2 tokens at the top.
assets/site.js              ~22KB, no dependencies. Degrades without JS.
scripts/check-copy.py       Enforces A3/A4/B3. CI runs this too.
```

## One warning about editing

The HTML files **are** the source. The Python generators used to scaffold them
were throwaway and are not in this repo. Do not regenerate pages from a script
and overwrite them — hand edits (the humanized copy, the section rail) live
only in the HTML. If you find yourself writing a generator, make it patch the
files rather than rewrite them, and check `git diff` before committing.

## The rules, enforced in code

`scripts/check-copy.py` is the single source of truth — the deploy script and
CI both call it, so the rules cannot drift between your machine and the
pipeline.

```bash
python3 scripts/check-copy.py
```

It fails the build on:

- **The AI rule (A4, revised).** Exactly **one** visible mention of "AI",
  and it must be the FAQ answer. Both failure modes are caught: leakage into
  headings or body copy, *and* total silence, which reads as evasive once an
  owner asks. The FAQ question is mirrored in the FAQPage structured data;
  the checker strips JSON-LD and HTML comments before counting, so that
  legitimate duplicate does not trip it.
- **Banned vocabulary (A4):** seamless, leverage, empower, streamline, robust,
  cutting-edge, ecosystem, synergy, digital transformation, end-to-end,
  orchestration, "platform" and "solutions" as standalone nouns.
- **No invented proof (A3):** testimonials, "trusted by", statistics,
  award claims.
- **Mockup captions (A3.3):** the hero desk and the owner summary must each
  carry *Example. Yours is built around the tools you already use.*
- **No all-caps labels (B3).**
- **No patient-record examples (A1.4)** in any health-industry line.
- **Production is indexable.** `_headers` and `robots.txt` say so, and the production gate enforces it.

## The shared check (C0)

One client-side state object drives the hero CTA, the recognition wall, the
calculator and the result panel. **Nothing is stored or sent** until the
visitor books a walkthrough. No account, no sign-up. Answers travel to the booking page through `sessionStorage`, written
only when they press the booking button.

Scoring is exactly as specified: each selected statement adds one point to
each workflow it maps to; ties break by the chosen industry's priority order,
then by the default order W3, W5, W8, W1, W7, W4, W6, W2. The statement-to-
workflow mapping lives in `data-maps` in `index.html`; the workflow titles,
outcomes and per-industry example lines live in `WORKFLOWS` in
`assets/site.js`.

Verified: picking R2 + R5 + R6 with "Home services & trades" returns
W3 (2 points), then W5 and W6 on the industry tie-break. 10 hours a week
reads as "about 500 hours a year, or 12.5 full work weeks."

### The questions are the same for every business

The result panel asks the same questions of **every visitor**, whatever they
run. Industry is a filter on the *answers*, never on the questions -- it
reorders the three workflows and picks which example sentence to show, and that
is all it does. There are no per-industry question packs, because we have no
owner interviews behind them and a question we invented is worse than one we
didn't ask.

| Question | Field | Required | Where it goes |
| --- | --- | --- | --- |
| What kind of business | `check.industry` | yes | reorders the results, picks the example line, prefills the booking form |
| How many people work there | `check.size` | no | prefills the booking form's "how many people" |
| How much of the week goes to admin | `check.timeBand` | no | the time sentence, and the booking email |
| Which of the three to fix first | `check.priority` | no | the booking email |
| Anything specific to your business | `check.notes` | no | prefills the booking form's "what eats up the most time" |

Industry is the one the panel insists on, and the reason is not lead capture --
the booking form already requires it, so no request reaches us without it. It
is that the panel is headed "in a business like yours" and the per-industry
line is the only genuinely tailored sentence in it. Showing the list to someone
whose business we have not asked about means promising something we haven't
done. It is enforced the way the booking form enforces the same question:
an inline error on the attempt, never a disabled button with no explanation,
and the results still render while it is unanswered.

The last one is the only place the answers stop being identical, which is the
point: consistent questions, one open field for what consistency can't reach.

Two rules that the code comments also carry, because both have been broken
before:

- **Never quote a default back as an answer.** Time is a band, not a slider
  reading, and "Not sure" produces no sentence at all -- the panel links to the
  estimator instead of picking a number. Opening the team fields no longer sets
  `hoursConfirmed`, which used to let the panel say "you said about 10 hours"
  to someone who never touched the slider.
- **Free text never reaches analytics.** `check_notes` records whether the box
  was filled, not what was in it. Everything else the check collects is a fixed
  value from a fixed list, so those events carry the value.

The reason a workflow is on the list is the visitor's own selections, quoted
back ("You picked: Invoices going out late"), not an assertion about their
industry that we can't support.

## Before launch — the A1 decisions and every placeholder

Nothing with a yellow highlight may ship. That is no longer a note you have to
remember -- it is a gate you can run:

```bash
python3 scripts/check-copy.py              # staging: placeholders allowed, listed every run
python3 scripts/check-copy.py --production # the launch gate: placeholders are failures
```

Staging still insists the site stays out of search results. Production inverts
that: it fails if `_headers` still sends `noindex` or `robots.txt` still has
a blanket `Disallow: /`, because shipping with the staging guards on means
nobody ever finds the site.

Run the production gate to see exactly what is still blocking launch. Three
things it deliberately does NOT check, because they cannot be checked from the
repo: canonical tags and an absolute `og:image` (both need the real domain), a
test enquiry actually sent and received, and whether the legal entity details
are correct rather than merely present.

| What | Where |
|---|---|
| Prices: assessment, first project, care plan | `index.html` C9, `assessment.html`, FAQ |
| Sample assessment pages | `assessment.html` |
| Legal entity name, registered address and governing jurisdiction | `privacy.html`, `terms.html` |
| A real number in the case study, and written permission if the client is ever to be named for real | `kitchen-club.html` |
| Real recognition statements from 8–10 owner interviews (A1.6) | `index.html` C2 |
| Founder name, photo and story | removed at the owner's instruction — see *Deliberately absent* |
| Where credentials are stored and who has access | the "Is my data safe?" answer says neither |

Nothing in that table blocks launch. `check-copy.py --production` is the
authority on what does, and as of 16 Sep 2026 it lists only the three
indexing switches.

### The forms are live

Both the walkthrough form and the "not seeing yours?" box POST to a Google
Apps Script web app running in the owner's own account, which emails the
enquiry on with Reply-To set to the visitor. Confirmed working end to end on
16 Sep 2026, including the part I could not test from a sandbox: Apps Script
does return the CORS header the browser needs to read the reply, so the POST
path resolves rather than silently falling back.

The mail-app fallback is still there and still wired. It is now a safety net
for an endpoint that is down or unreachable, not the normal path. Setup and
the script itself are in `docs/form-endpoint-setup.md`.

## Deliberately absent

- **Photography.** The spec wants up to six photos; we have no client photos
  and no signed releases. Stock imagery of "a contractor" is what makes a site
  fail its own logo test. The desk language carries it. Replace within 90 days
  of the first client, per B7.
- **Tool names and logos.** A3.6 permits them only for tools we have actually
  worked in. The tools strip lists categories until that is true.
- **Resources, blog, industry pages.** An empty section makes a new company
  look thin.
- **"Email me this list."** The result panel used to offer to mail the visitor
  their own list. Removed 15 Sep 2026: it was the only thing on the site
  that sent mail TO a stranger, which needs a transactional sender, SPF/DKIM
  on the domain and a serverless function to hold the key -- a lot of
  machinery, and a domain-reputation risk, to save a screenshot. Its opt-in
  checkbox was also the site's only marketing consent; there is now no
  mailing list anywhere, and privacy.html says so.
- **Any founder or company history.** The founder photo slot, the unwritten
  story and the ZEDventures explainer were all removed on 15 Sep 2026 at the
  owner's instruction. The only human trace left is "Built by ZEDventures"
  in the footer. This is a deliberate state, not an oversight, but it is a
  real gap for a trust-led service business: there is currently no person on
  the site for a visitor to buy.

## Hosting — Cloudflare Pages

Live at **https://automatesmall.com** since 16 Sep 2026. Fly.io was retired the
same day; the Dockerfile, `nginx.conf`, `fly.toml` and both deploy scripts were
deleted, along with the GitHub workflow that had failed on every one of its 21
runs for want of a `FLY_API_TOKEN` nobody ever set.

There is no deploy command any more. Push to `main` and Cloudflare builds it.

Cloudflare now routes "connect a repository" into the **Workers** flow rather
than Pages, and a Workers build runs `npx wrangler deploy`. `wrangler.jsonc`
is what makes that work: an assets-only Worker with no script, serving `dist/`
from the edge.

| Cloudflare build setting | Value |
|---|---|
| Build command | `bash scripts/build.sh` |
| Deploy command | `npx wrangler deploy` |
| Root directory | `/` |
| Production branch | `main` |

Everything else — the project name, what is served, 404 handling — comes from
`wrangler.jsonc` rather than the dashboard, so it is in version control and
reviewable.

`scripts/build.sh` assembles only what a visitor should see: the ten pages,
`robots.txt`, `sitemap.xml`, `assets/`, `_headers`, and a version stamp. It
exists because Pages publishes a directory, and the repository root contains
`docs/` — including a UX audit describing everything unfinished about the site.

`_headers` does what `nginx.conf` used to: nosniff, referrer policy, and
`Cache-Control: no-cache` while `styles.css` and `site.js` are unfingerprinted.
Fingerprint them and a long `max-age` can go back.

### Telling a current deploy from a stale one

Every build stamps its commit at `/version.txt`:

```bash
curl -s https://automatesmall.com/version.txt
git rev-parse --short HEAD
```

Those should match. This exists because once they didn't: an old build sat on
staging looking current, and nothing on the page or in any deploy output could
tell you which was which. The stamp comes from `WORKERS_CI_COMMIT_SHA` on
Workers Builds, `CF_PAGES_COMMIT_SHA` on Pages, and `git rev-parse` locally.

### Indexing

The site is indexable. `_headers` sends no `X-Robots-Tag`, `robots.txt` allows
everything and points at the sitemap.

To hide work in progress, push a branch — Cloudflare serves previews on their
own hostnames — rather than putting `noindex` back on production.
`scripts/check-copy.py --production` fails if it reappears.

`scripts/build.sh` makes that safe on its own. It reads the branch from
`WORKERS_CI_BRANCH` / `CF_PAGES_BRANCH` (falling back to `git`), and anything
that is not `main` gets a `Disallow: /` robots.txt, an `X-Robots-Tag:
noindex, nofollow` header, and no sitemap. Both robots.txt and the header,
because robots.txt asks a crawler not to fetch while the header tells one that
already fetched not to index — and a preview URL pasted into a chat gets
fetched.

The repository's own `_headers` and `robots.txt` are never touched by this;
only the built output is. That is deliberate. `--production` reads the files,
so if the gate read the build instead it could be fooled by the branch it
happened to run on.

Check a preview before sharing it:

```bash
WORKERS_CI_BRANCH=staging bash scripts/build.sh
grep -c noindex dist/_headers   # 1
cat dist/robots.txt             # Disallow: /
ls dist/sitemap.xml             # should not exist
```

### Before showing it to anyone outside the business

This section used to list what was still fake: a placeholder founder name and
photograph, placeholder legal entity details, and a booking form that
validated but transmitted nothing. None of that is true any more — the founder
block was removed rather than filled, the entity details are real, the forms
post to a live endpoint, and `--production` reports no placeholders. Kept as a
heading because the question it asks is permanent: run the production gate and
read its output before sending a link to anyone outside the business.

## Pre-launch test (Part F)

Put this in front of at least five real small-business owners before it goes
live. Do not explain the company first. Five seconds on the home page, then:
who is this for, what do they do, what caught your eye? Then let them browse,
then ask what sounded most like their business, what was confusing, what would
stop them calling, and what they'd expect it to cost.

Rewrite the section 02 statements in their words. That section is the whole
site's hinge, and right now it is our guess at what owners say.
