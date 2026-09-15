# UX audit — gap analysis and implementation plan

Audited against commit `d7296f1`, 15 Sep 2026. Every status below was
verified by running the code, not by reading it. Where I disagree with a
finding, the evidence is given so you can overrule me.

**Headline: finding 1 is real and I had missed it.** My own form testing
loaded `book.html` directly, which never reproduces the bug. Arriving from
the result drawer does.

---

## Status summary

| # | Finding | Status |
|---|---------|--------|
| 1 | Check → booking journey broken | **Missing** — confirmed, root cause found |
| 2 | Internal/draft content | **Partially implemented** |
| 3 | One pricing model | **Missing** + needs owner input |
| 4 | False personalization ("You said…") | **Missing** — confirmed |
| 5 | Mobile floating CTA | **Missing** — confirmed, 160×132px at 320px |
| 6 | Hero doesn't say what this is | **Partially implemented** |
| 7 | Reorganize 13 services | **Decided: keep flat. Closed.** |
| 8 | Move proof earlier | **Missing** + needs owner input |
| 9 | Calculator claims | **Missing** — confirmed |
| 10 | Simplify buying journey | **Missing** — confirmed, 3 competing systems |
| 11 | Booking terminology | **Already implemented** (commit `3edb29c`) |
| 12 | Privacy language | **Partially implemented** — one absolute claim left |
| 13 | Shorten homepage | **Missing** — 8,722px at 1440 |
| 14 | Dashboard Approve button | **Missing** — confirmed, no handler |
| 15 | Heading semantics | **Partially implemented** — 2 pages jump h1→h3 |
| 16 | Mobile menu Escape | **Missing** — confirmed |
| 17 | Email opt-in text | **Already resolved** — that form was deleted (`66a4c28`) |
| 18 | SEO / social metadata | **Partially implemented** |

---

## 1 — Check → booking journey · MISSING · P1

**Confirmed.** Journey: home → pick 3 statements → drawer → "Ask for a free
walkthrough" → `book.html`. Console shows:

```
PAGEERROR Cannot read properties of undefined (reading 'R1')
"From your check": { wrapHidden: false, items: [] }
```

The heading renders and the list under it is empty — exactly as described.

**Root cause** (`assets/site.js`): `STATEMENT_TEXT` is declared with `var`
*after* the `booking()` IIFE that consumes it. `var` hoists the declaration
but not the assignment, so at execution time it is `undefined` and
`STATEMENT_TEXT[id]` throws. The `|| id` fallback never fires because the
throw happens on the property access itself. `chipWrap.hidden = false` runs
*before* the loop, which is why you get a visible empty block rather than
nothing.

**Fix:** move the `STATEMENT_TEXT` literal above `booking()`. One-line move,
no behaviour change. Everything else in this finding is separate work.

**Form state, verified:**

| Requirement | Now |
|---|---|
| `action` / `method` | **absent** — would default to GET |
| `name` on every field | **absent on all 5** |
| native `required` | **absent** — uses `data-required` |
| `<label for>` | present on all 5 ✓ |
| accessible errors | present (`aria-invalid` + `#id-err`) ✓ |
| submit loading state | **missing** |
| duplicate-submit protection | **missing** |
| server error state | **missing** |
| preserve input on failure | **untestable — nothing submits** |

**Files:** `assets/site.js` (`booking()`, ~line 510-560), `book.html` (form).

**Blocked:** everything past the hoisting fix needs the relay endpoint. The
end-to-end test enquiry the audit demands is impossible until then.

## 2 — Internal/draft content · PARTIALLY IMPLEMENTED · P1

Founder placeholders, photo slots and contact placeholders are gone
(commits `d8a1060`, `98af745`, `15c5488`, `d7296f1`). **21 remain**, all
genuinely blocked on you:

- 9 price placeholders (`[$X]`, `[$X–$Y]`, `[fixed price]`, `[price to be confirmed]`)
- 6 timeline placeholders (`[1–2 weeks]`, `[2–6 weeks]`)
- 2 legal entity / registered address
- `[Confirm before launch: no charge, or refund.]`
- `[Add specifics once confirmed: where credentials are stored…]`
- Assessment "sample pages" slot

**Needs owner input.** I will not invent prices, timelines or a legal entity.

## 3 — One pricing model · MISSING · P1

**Contradiction confirmed.** `index.html:430-442` and `how-it-works.html:124-126`
present fixed prices and timelines as placeholders, while `services.html:177`
says pricing is "quoted after the free walkthrough". Both claims ship today.

**Proposal:** a single `PRICING` object in `assets/site.js` plus
`data-price="assessment|project|care"` spans, so one edit updates all five
surfaces. Structure buildable now; values need owner input.

## 4 — False personalization · MISSING · P1

**Confirmed, and worse than described.** Selecting one statement without
touching the calculator produces:

> "You said about 10 hours a week. That's around 500 hours a year, or 12.5 full work weeks."

The visitor said nothing. 10 is the slider default.

**Fix:** `timeConfirmed` flag in the `check` state object, set on slider
`input`. Until true, suppress the sentence and offer "Estimate my admin time".

**Files:** `assets/site.js` (`check` object, `renderPanel()`), `index.html` `#time`.

## 5 — Mobile floating CTA · MISSING · P1/P2

**Confirmed and measured** — `.pill.is-on`, `position: fixed`:

| Viewport | Size |
|---|---|
| 320px | **160 × 132px** |
| 375px | 188 × 114px |
| 390px | 195 × 96px |
| 430px | 215 × 78px |

Label "1 picked. See what we'd look at first" wraps to four lines at 320px.

**Fix:** shorten to "View results · 1 selected"; bottom action bar with
`env(safe-area-inset-bottom)`; body padding while shown.

**Files:** `assets/styles.css` (`.pill`), `assets/site.js` (label text).

## 6 — Hero positioning · PARTIALLY IMPLEMENTED · P2

The h1 is a question: *"How much of your day is spent running the business
instead of growing it?"* The sub-copy does name the work and say "using the
tools you already have". So the *what* is present but arrives second, and
the audience ("3–50 people") is only in an eyebrow.

Weaker than the audit implies, but the direction is right. **Needs your call**
— this is brand voice, not a defect.

## 7 — Reorganize services · DECIDED: KEEP FLAT · closed

The audit wants the 13 services grouped into 3–4 problem groups.

**The owner has decided against it, twice.** First on 15 Sep: *"i dont want
you to start by clubing the services into groups. Keep them separate for now..
you have that later on the page 'Or take a bundle'."* Then again on 16 Sep,
after the grouping was proposed a second time and stopped mid-edit: *"Keep
them flat, don't group them."*

Current and intended state: 13 flat `.svc` cards, with the bundles section
below for anyone who wants them packaged. That already gives a visitor both
routes — pick one problem, or take a set — just in the opposite order to the
audit's preference.

**This is settled. Do not re-raise it from the audit document.** If it is
revisited it should be because the owner asks, or because real visitor
behaviour says the flat list is not working — not because a finding list
still has it open.

Still outstanding regardless of grouping, and needing owner input rather than
a layout change: what each service includes and excludes, any prerequisites,
and a typical timeline.

Also missing per finding, regardless of grouping: what's included/excluded,
prerequisites, timeline, and a "Discuss this problem" CTA that carries the
service into the enquiry.

## 8 — Proof earlier · MISSING · P2

`#story` sits between the calculator and pricing — roughly 60% down an
8,722px page. Moving it up is cheap. The *content* gap (approved quote,
real scope, measured outcome) is **owner input** and has been outstanding
since the case study was written: you still need written permission and the
one real number.

## 9 — Calculator claims · MISSING · P2

**Confirmed.** Output reads "About 500 hours a year" and then
**"What would you do with 500 hours back?"** — which directly implies admin
time equals recoverable time. Team-member inputs add to the total with no
label saying whether a figure is owner-only, team, or combined.

**Files:** `index.html` `#time`, `assets/site.js` calculator handler.

## 10 — Simplify buying journey · MISSING · P2

**Confirmed, three systems:** `index.html#how` (5 steps), `how-it-works.html`
(31 step elements), `assessment.html` (14 stage elements). Plus the pricing
section's three tiers. Consolidation is a content restructure, not a bug fix.

## 11 — Booking terminology · ALREADY IMPLEMENTED

Done in `3edb29c`, before this audit arrived. 31 CTAs moved from "Book" to
"Ask for"; "Find a time" → "Reach out to us"; the "we'll find a time" lede
and both meta descriptions corrected.

Audit prefers "Request". "Ask for" is plainer and fits the site's voice.
Cosmetic — say the word if you want "Request".

## 12 — Privacy language · PARTIALLY IMPLEMENTED

Done (`6e0f4e1`, `9348f1f`): the false collection claim, the false analytics
claim, session-storage specifics, no-access-log disclosure, Google Fonts
IP disclosure, real privacy contact address.

**Still open — the audit is right and I missed it:** `privacy.html:68` says
**"We never sell or share your data"** while the same page says service
providers can access what passes through them. Absolute claim, contradicted
two paragraphs later. Needs the sell-vs-service-provider distinction.

Also missing: a small **Privacy** link beside each form collecting an email.
Retention and deletion language exists but is future-tense.

Final legal copy **needs owner/legal approval**.

## 13 — Shorten homepage · MISSING · P2

**8,722px at 1440×1000** (audit measured 8,578 pre-changes). The audit's
recommended hierarchy matches the current sections closely; the work is
moving methodology to How It Works, the catalog to Services, and cutting the
FAQ from 12 to 5–7.

## 14 — Dashboard Approve button · MISSING · P3

**Confirmed.** `<button class="row__act">Approve</button>`, not disabled, no
handler bound. Looks live, does nothing. Same class of defect as the dead
forms. Cheap fix.

## 15 — Heading semantics · PARTIALLY IMPLEMENTED · P3

Every page has exactly one h1. Outlines are clean on 8 of 10.
**`privacy.html` and `terms.html` both jump h1 → h3** — as the audit predicted.
Process steps are `<div>`s, not ordered lists.

## 16 — Mobile menu Escape · MISSING · P3

**Confirmed at 390px.** Menu open → Escape → still open, `aria-expanded`
still `"true"`. Focus is on the toggle, so only the handler is missing.

**Note:** the *drawer's* Escape/focus-trap works correctly and must be
preserved — the audit says so and I agree.

## 17 — Email opt-in text · ALREADY RESOLVED

"Send me occasional tips. (Unticked by default.)" lived in the "Email me this
list" form, which you had me delete (`66a4c28`). No opt-in exists anywhere
now, and `privacy.html` says there is no mailing list. **Nothing to do.**

## 18 — SEO / social metadata · PARTIALLY IMPLEMENTED · P3

- `og:image` — asset now **exists** (`6e0f4e1`); audit correctly says this was never a bug
- **canonical: absent on all 10 pages**
- `og:image` is relative, not absolute
- Titles thin: "Services", "Privacy", "Terms", "How It Works" — unbranded
- No sitemap
- Staging noindex correctly in place ✓ (`nginx.conf`, `robots.txt`, both guarded)

**Blocked on the production domain**, except titles, which can be done now.

## Phase 4 — analytics · MISSING

A `track()` shim exists pushing to `dataLayer`; nothing consumes it. Backend
acceptance cannot be tracked separately until the forms submit at all.

---

## Dependency order

```
STATEMENT_TEXT hoisting fix ──► "From your check" works
                                        │
Formspree endpoint (owner) ─────────────┼──► form names/action/states
                                        │       │
                                        │       └──► end-to-end test enquiry
                                        │       └──► privacy "what we receive" rewrite
                                        │       └──► backend-acceptance analytics
Prices + timelines (owner) ─────────────┴──► single pricing source of truth
Case study number + permission (owner) ─────► proof section moved earlier
Production domain (owner) ──────────────────► canonical, absolute og, sitemap
```

## Proposed batches

**Batch 1 — no owner input needed, all verified defects**
`STATEMENT_TEXT` hoisting · false personalization · mobile CTA · Approve
button · Escape handler · h1→h3 on the legal pages · "never sell or share"
· form `name`/`action`/native `required` · privacy links beside forms.

**Batch 2 — needs the relay endpoint**
Form submission, loading/error/success states, duplicate-submit protection,
input preservation on failure, the end-to-end test enquiry, privacy rewrite.

**Batch 3 — needs prices**
Single pricing source of truth across all five surfaces.

**Batch 4 — content restructure** (done, commit `2c4e47e`)
Hero positioning · proof earlier · homepage shortening · unified buying
journey. Services grouping was declined by the owner; calculator framing
(finding 9) is the one item from this batch still open.

**Batch 5 — production hardening**
Titles now; canonical, absolute og, sitemap once a domain exists. Analytics
last, since backend acceptance is the only event worth trusting.

## What I am not touching

Per the audit's own "do not change" list, and confirmed working: the visual
system, card treatment, typography, drawer keyboard behaviour (focus trap,
Escape, focus return), preview tab keyboard support, case-study images and
alt text, the no-email-gate results.
