# AutomateSmall — website

Static site. No build step, no framework, no package manager. Open `index.html`
in a browser, or serve the folder:

```bash
python3 -m http.server 8080     # then visit http://localhost:8080
```

## Files

```
index.html                  Home — the 12 sections from the spec, in order
how-it-works.html           Methodology + engagement process
operations-assessment.html  Exactly what the customer receives in step 2
about.html                  Founder story, AutomateSmall story, ZEDventures
book.html                   Free walkthrough request (3 questions + email)
privacy.html                Plain-English privacy page
terms.html                  Website terms
assets/styles.css           One stylesheet. Tokens at the top.
assets/site.js              ~12KB, no dependencies. Everything degrades without it.
```

## Rules this site is built to

These are enforced in the code, not just in the copy. Re-check them before any
change ships.

- **The words "AI" and "artificial intelligence" appear nowhere.** Not in copy,
  meta descriptions, alt text, comments, or class names.
- **No fake proof.** No testimonials, customer quotes, statistics, client logos,
  tool logos, case studies, or security claims we cannot support. The
  recognition statements in section 02 are deliberately unattributed — they are
  not quotes, and must not be presented as quotes until they come from real
  owner interviews.
- **Every mockup is labelled** `Example. Yours is built around the tools you
  already use.`
- **Banned vocabulary:** seamless, leverage, empower, streamline, robust,
  cutting-edge, transformation, ecosystem, synergy, end-to-end, orchestration,
  intelligent automation, digital transformation, "platform" (describing us),
  "solutions" (without saying what they do).

Quick audit:

```bash
grep -rnE '\bAI\b|[Aa]rtificial [Ii]ntelligence' --include=*.html --include=*.js .
grep -rniE 'seamless|leverage|empower|streamline|robust|cutting-edge|transformation|ecosystem|synergy|end-to-end|orchestrat|\bplatform|\bsolutions?\b' --include=*.html .
```

Both should return nothing.

## Before launch — fill these in

Search for `tofill` (a highlighted span) and for `PHOTO SLOT` comments.

| What | Where |
|---|---|
| Founder name | `index.html` section 10, `about.html` |
| Founder photograph | `index.html` and `about.html` — `.portrait` blocks |
| Legal entity name + registered address | `privacy.html`, `terms.html` |
| Contact email | `privacy.html`, `terms.html` |
| Booking form destination | `assets/site.js`, `book()` — see the NOTE comment |

The walkthrough form currently validates and shows a confirmation, but
**transmits nothing**. Connect it to a booking tool or inbox before launch, or
take the page down.

## Photography

There is none, on purpose. The spec asks for 4–6 photographs of real small
businesses; we have no customer photographs yet, and generic stock photography
of "a contractor" is exactly what makes the site fail its own test — a visitor
should not be able to mistake this for an IT consultancy. The Owner's Desk
illustration language carries the page instead.

When real customer photographs exist, add them at: the recognition section
(section 02), the founder section (section 10), and the final CTA. Natural
daylight, candid, actual work happening, nobody smiling at the camera. Use
WebP/AVIF with `loading="lazy"` and explicit `width`/`height`.

## Accessibility

Targets WCAG 2.2 AA. Keyboard operable throughout, visible focus states,
44px minimum touch targets, pause control on the rotating hero questions,
`prefers-reduced-motion` honoured (the desk resolves instantly instead of
animating), native `<input type="range">` for the calculator, native
`<details>` for the FAQ, and no status communicated by colour alone — every
state carries a text label and an icon.

## Deliberately not built

Per the spec's V1 scope: no scoring algorithm, no stored profiles, no accounts
or login, no recommendation engine, no CRM behaviour, no personalised email
reports. The "where we'd start" panel is a direct lookup from what the visitor
tapped — nothing is scored and nothing is stored.

Also not built: a blog, resources, case studies, news, or partners. Empty
sections make a new company look thinner, not larger. Add them when there is
real content.

## Pre-launch test

Put this in front of at least five real small-business owners before it goes
live. Do not explain the company first. Five seconds on the home page, then:
who is this for, what do they do, what caught your eye? Then let them browse,
then ask what sounded most like their business, what was confusing, what would
stop them calling, and what they'd expect it to cost.

Rewrite the section 02 statements in their words. That section is the whole
site's hinge, and right now it is our guess at what owners say.
