#!/usr/bin/env python3
"""Enforce the spec's non-negotiable copy rules (A3, A4, B3).

Run before every deploy. CI runs this too; it is the single source of truth
for the rules, so they cannot drift between a local check and the pipeline.

    python3 scripts/check-copy.py
"""
import glob, io, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)

COMMENT = re.compile(r'<!--.*?-->', re.S)
LDJSON  = re.compile(r'<script type="application/ld\+json">.*?</script>', re.S)
TAG     = re.compile(r'<[^>]+>')

# A4 banned vocabulary. "platform" and "solutions" are banned as standalone
# nouns describing what we do.
BANNED = ['seamless', 'leverage', 'empower', 'streamline', 'robust',
          'cutting-edge', 'ecosystem', 'synergy', 'digital transformation',
          'end-to-end', 'artificial intelligence', 'orchestrat',
          r'\bplatform\b', r'\bsolutions\b']

# A3 no invented proof.
FAKE = ['testimonial', 'trusted by', 'customers served', 'award-winning',
        'certified partner', r'\d+% (increase|faster|more)']

fails = []
def fail(msg): fails.append(msg)

def visible(src):
    """Copy a visitor actually reads: no comments, no structured data, no tags."""
    return TAG.sub(' ', LDJSON.sub(' ', COMMENT.sub(' ', src)))

pages = sorted(glob.glob('*.html'))
if not pages:
    fail('no HTML pages found')

body = ''.join(visible(io.open(p, encoding='utf-8').read()) for p in pages)
home = io.open('index.html', encoding='utf-8').read()

# --- A4: the AI rule. Exactly one mention, and it is the FAQ question. -------
ai = re.findall(r'\bAI\b', body)
if len(ai) != 1:
    fail('"AI" appears %d times in visible copy; the spec allows exactly one, '
         'in the FAQ answer. Silence reads as evasive; more than one breaks '
         'the rule that owners never need the technology explained.' % len(ai))
if 'Do you use AI?' not in home:
    fail('the "Do you use AI?" FAQ question is missing; total silence on it '
         'reads as evasive once an owner asks.')

# --- A4: banned vocabulary --------------------------------------------------
for word in BANNED:
    if re.search(word, body, re.I):
        fail('banned word in visible copy: %s' % word)

# --- A3: no invented proof --------------------------------------------------
for word in FAKE:
    if re.search(word, body, re.I):
        fail('unsupported-proof language in visible copy: %s' % word)

# --- A3: every mockup carries the caption -----------------------------------
cap = 'Example. Yours is built around the tools you already use.'
if body.count(cap) < 2:
    fail('the hero desk and the owner summary must each carry: "%s" '
         '(found %d)' % (cap, body.count(cap)))

# --- B3: no all-caps labels anywhere ----------------------------------------
css = io.open('assets/styles.css', encoding='utf-8').read()
if re.search(r'text-transform\s*:\s*uppercase', css):
    fail('text-transform:uppercase in the stylesheet; B3 forbids all-caps labels.')

# --- A1.4: no patient-record examples ---------------------------------------
for line in re.findall(r'data-ex-health="([^"]*)"', home):
    if 'patient record' in line.lower():
        fail('health example mentions patient records: %r (A1.4)' % line)

# --- No real personal data in the pages -------------------------------------
# The Food Explorers screenshots contain a real instructor name and email.
# Nothing resembling a live address may reach a published page; the only
# addresses allowed are the obvious example one on the booking form and the
# marked [contact email] placeholders.
#
# mayurk@automatesmall.com is the business contact address and is meant to be
# public -- it is in the footer of every page and on both legal pages. It is
# listed here deliberately, as an allowlist entry, so that adding it did not
# mean weakening or disabling the check that keeps every OTHER real address
# out. Anything not on this list still fails the build.
ALLOWED_EMAILS = {'you@yourbusiness.com', 'mayurk@automatesmall.com'}
for page in pages:
    raw = io.open(page, encoding='utf-8').read()
    for addr in set(re.findall(r'[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}', raw)):
        if addr not in ALLOWED_EMAILS:
            fail('%s contains what looks like a real email address (%s). '
                 'Use a placeholder, or redact it.' % (page, addr))

# --- Staging must not be indexable ------------------------------------------
if os.path.exists('nginx.conf'):
    if 'noindex' not in io.open('nginx.conf', encoding='utf-8').read():
        fail('nginx.conf is missing the noindex header (staging carries placeholders).')
if os.path.exists('robots.txt'):
    if 'Disallow: /' not in io.open('robots.txt', encoding='utf-8').read():
        fail('robots.txt is not disallowing crawlers.')

# --- Structural spine of the home page ---------------------------------------
# A bulk edit once deleted the whole trust band and the FAQ section wrapper
# without any other check noticing, because the page still parsed and the line
# count went up. These assertions are cheap and would have caught it.
EXPECTED_SECTIONS = ['recognition', 'teams', 'how', 'view', 'time',
                     'story', 'pricing', 'own', 'faq', 'final']
found = set(re.findall(r'<section[^>]*id="([^"]+)"', home))
for sec in EXPECTED_SECTIONS:
    if sec not in found:
        fail('index.html is missing the #%s section.' % sec)

for needle, what in [('class="trust"', 'the trust band'),
                     ('class="faq"', 'the FAQ block'),
                     ('class="wall"', 'the recognition wall'),
                     ('id="drawer"', 'the result panel')]:
    if needle not in home:
        fail('index.html is missing %s (%s).' % (what, needle))

n_faq = home.count('<details>')
if n_faq < 10:
    fail('index.html has only %d FAQ entries; expected at least 10.' % n_faq)

# Every rail chip must point at a section that exists.
for sec in re.findall(r'data-sec="([^"]+)"', home):
    if sec not in found:
        fail('the section rail links to #%s, which does not exist.' % sec)

# --- Every referenced local file must exist ----------------------------------
# og.png was declared in index.html for weeks and never existed, so every link
# shared to LinkedIn or Slack fetched a 404. The earlier version of this check
# only looked at src= and href=, and og:image uses content=.
for page in pages:
    raw = io.open(page, encoding='utf-8').read()
    refs = set(re.findall(r'(?:src|href|content)="((?:assets|scripts)/[^"]+)"', raw))
    for ref in refs:
        if not os.path.exists(ref.split('?')[0].split('#')[0]):
            fail('%s references %s, which does not exist on disk.' % (page, ref))

# --- The privacy page must describe the site that actually exists ------------
# It claimed "we receive what you typed" while every form transmitted nothing,
# and claimed privacy-friendly analytics while none were installed. Both were
# false statements of fact about data handling on a public page. These two
# checks tie the copy to the code, in both directions, so neither can drift.
js = io.open('assets/site.js', encoding='utf-8').read()
privacy = TAG.sub(' ', COMMENT.sub(' ', io.open('privacy.html', encoding='utf-8').read()))
privacy = re.sub(r'\s+', ' ', privacy)

forms_are_dead = 'NOTE FOR LAUNCH' in js
says_it_collects_nothing = 'collects nothing at all' in privacy

if forms_are_dead and not says_it_collects_nothing:
    fail('site.js still carries a NOTE FOR LAUNCH, so the forms transmit nothing, '
         'but privacy.html no longer says the site collects nothing. One of the '
         'two is now a false statement about data handling.')
if not forms_are_dead and says_it_collects_nothing:
    fail('the forms look connected (no NOTE FOR LAUNCH in site.js) but privacy.html '
         'still tells visitors the site collects nothing. Update the privacy page '
         'BEFORE the forms go live, not after.')

ANALYTICS = ['plausible', 'fathom', 'umami', 'gtag(', 'googletagmanager',
             'matomo', 'segment.com', 'posthog']
html_and_js = ''.join(io.open(f, encoding='utf-8').read() for f in pages) + js
analytics_installed = any(a in html_and_js.lower() for a in ANALYTICS)
claims_no_analytics = 'no analytics on it' in privacy

if analytics_installed and claims_no_analytics:
    fail('an analytics provider is installed but privacy.html still says there is '
         'no analytics on the site. Name the provider on the privacy page.')
if not analytics_installed and not claims_no_analytics:
    fail('privacy.html no longer states that the site has no analytics, but no '
         'analytics provider is installed. Say what is actually true.')

# --- Dead forms may not promise a reply --------------------------------------
# The booking form said "expect a reply with a couple of times to choose from",
# the services box said "we'll come back to you within a business day", and the
# drawer said "Sent. Check your inbox in a minute." All three transmitted
# nothing. A promise made to someone who just handed over their email is the
# worst thing on a site to get wrong, so it is guarded rather than remembered.
PROMISES = ['check your inbox', 'expect a reply', 'come back to you within',
            'read it before we call']
if forms_are_dead:
    for page in pages:
        flat = re.sub(r'\s+', ' ', TAG.sub(' ', COMMENT.sub(' ', io.open(page, encoding='utf-8').read()))).lower()
        for promise in PROMISES:
            if promise in flat:
                fail('%s promises "%s" while the forms still transmit nothing '
                     '(site.js carries a NOTE FOR LAUNCH). Say what actually '
                     'happens, or connect the form.' % (page, promise))

# --- The README must not contradict the site it documents --------------------
# A stale README line ("the case-study slot is out of the page") survived the
# case study going live, was read by an outside auditor, and came back as a
# finding. Docs that drift produce confident, wrong advice.
if os.path.exists('README.md'):
    readme = io.open('README.md', encoding='utf-8').read()
    for present, claim, what in [
            (os.path.exists('food-explorers.html'),
             'case-study slot', 'the case study is live but README still calls it absent'),
            (os.path.exists('assets/og.png'),
             'PLACEHOLDER: render the hero desk', 'og.png exists but README still calls it a placeholder')]:
        if present and claim in readme:
            fail('README.md is stale: %s.' % what)

# --- Report -----------------------------------------------------------------
if fails:
    print('Copy checks FAILED:\n')
    for f in fails:
        print('  - %s' % f)
    sys.exit(1)

print('Copy checks passed (%d pages).' % len(pages))
print('  "AI": 1 visible mention, in the FAQ, as the spec requires.')
print('  Banned vocabulary: none. Unsupported proof: none.')
print('  Mockup captions: %d. All-caps labels: none.' % body.count(cap))
