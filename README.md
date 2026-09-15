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
then by the default order W3, W5, W8, W1, W7, W4, W6, W2. The mapping lives in
`data-maps` on each statement and the industry lines in `data-ex-*` on each
workflow card, so the copy and the logic cannot fall out of step.

Verified: picking R2 + R5 + R6 with "Home services & trades" returns
W3 (2 points), then W5 and W6 on the industry tie-break. 10 hours a week
reads as "about 500 hours a year, or 12.5 full work weeks."

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

| Pages setting | Value |
|---|---|
| Framework preset | None |
| Build command | `bash scripts/build.sh` |
| Build output directory | `dist` |
| Production branch | `main` |

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
tell you which was which. On Pages the stamp comes from `CF_PAGES_COMMIT_SHA`.

### Indexing

The site is indexable. `_headers` sends no `X-Robots-Tag`, `robots.txt` allows
everything and points at the sitemap.

To hide work in progress, push a branch — Cloudflare serves previews on their
own hostnames — rather than putting `noindex` back on production.
`scripts/check-copy.py --production` fails if it reappears.

### Before showing it to anyone outside the business

The staging build still carries a placeholder founder name, a placeholder
founder photograph, placeholder legal entity details, and a booking form that
validates but transmits nothing. That is fine for the five-owner test in the
section below — those owners are being asked about the copy, not the company
details — but nothing here should be sent to a prospect as finished.

## Pre-launch test (Part F)

Put this in front of at least five real small-business owners before it goes
live. Do not explain the company first. Five seconds on the home page, then:
who is this for, what do they do, what caught your eye? Then let them browse,
then ask what sounded most like their business, what was confusing, what would
stop them calling, and what they'd expect it to cost.

Rewrite the section 02 statements in their words. That section is the whole
site's hinge, and right now it is our guess at what owners say.
