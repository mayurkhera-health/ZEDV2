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
about.html                  D3 — founder, and why a separate brand from ZEDventures
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
- **Staging stays non-indexable** while `nginx.conf` and `robots.txt` exist.

## The shared check (C0)

One client-side state object drives the hero CTA, the recognition wall, the
calculator and the result panel. **Nothing is stored or sent** until the
visitor presses "Email me this list" or books a walkthrough. No account, no
sign-up. Answers travel to the booking page through `sessionStorage`, written
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

Search for `tofill` and for `PHOTO SLOT`. Nothing with a yellow highlight may
ship.

| What | Where |
|---|---|
| Prices: assessment, first project, care plan | `index.html` C9, `assessment.html`, FAQ |
| Founder name and 80–120 word note | `index.html` C10, `about.html` |
| Founder photograph (real, not a studio shot) | `.portrait` blocks |
| Sample assessment pages | `assessment.html` |
| Legal entity, address, contact email, phone, city, region | `privacy.html`, `terms.html`, footer |
| Booking scheduler (A1.8) | `assets/site.js`, `booking()` |
| "Email me this list" mailer | `assets/site.js`, drawer submit handler |
| Open Graph image (desk end state, 1200×630) | `assets/og.png`, referenced in `index.html` |
| Real recognition statements from 8–10 owner interviews (A1.6) | `index.html` C2 |

The booking form and "Email me this list" both **validate and confirm but
transmit nothing**. Connect them or take those paths down before launch.

## Deliberately absent

- **Photography.** The spec wants up to six photos; we have no client photos
  and no signed releases. Stock imagery of "a contractor" is what makes a site
  fail its own logo test. The desk language carries it. Replace within 90 days
  of the first client, per B7.
- **Tool names and logos.** A3.6 permits them only for tools we have actually
  worked in. The tools strip lists categories until that is true.
- **The case-study slot.** Built as a comment in C10, out of the page until at
  least two real, permissioned case studies exist (A3.4).
- **Resources, blog, industry pages.** An empty section makes a new company
  look thin.

## Staging on Fly.io

The app is `automatesmall-staging`, a **new, standalone Fly app**. It has no
relationship to `fuelup-youth` (the frozen AthFuelPath rollback snapshot);
`scripts/deploy-staging.sh` refuses to deploy if `fly.toml` ever names it.

```
Dockerfile                  nginx:1.27-alpine serving the files on :8080
nginx.conf                  routing, noindex headers, gzip, 404
fly.toml                    app config, scales to zero when idle
scripts/deploy-staging.sh   guarded deploy
robots.txt                  Disallow: / — staging must not be indexed
404.html                    styled, uses the site's own stylesheet
```

First deploy, from a machine with `flyctl` installed and logged in:

```bash
cd ZEDV2
flyctl apps create automatesmall-staging      # name must be free across all of Fly
flyctl deploy --app automatesmall-staging --ha=false
```

After that, use the guarded script — it refuses to deploy a dirty tree, so the
live URL always corresponds to a commit:

```bash
./scripts/deploy-staging.sh
```

Lands at `https://automatesmall-staging.fly.dev`.

### Cost

`min_machines_running = 0` and `auto_stop_machines = "stop"`. The machine stops
when idle and starts on the next request, so an unvisited staging site runs no
compute. First request after an idle period takes an extra moment to wake.

Fly runs a VM to serve 146KB of static files. If cost or simplicity matters more
than keeping everything on one vendor, Cloudflare Pages or Netlify would host
this for free with no Dockerfile — the site is plain static output, so moving it
is a drag-and-drop.

### Not indexable, on purpose

`X-Robots-Tag: noindex, nofollow, noarchive` is set **once**, in `nginx.conf`,
plus `robots.txt`. That is deliberately the only place, so there is one line to
delete at launch. Do not add a second copy in `fly.toml`.

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
