# Form endpoint — Google Apps Script

Fifteen minutes, once. No new company involved: this runs in your own Google
account and sends from your own mailbox.

## 1. Create the script

Go to <https://script.google.com> → **New project**. Name it
`AutomateSmall form`. Delete whatever is in `Code.gs` and paste this:

```javascript
// Where enquiries land. Change this and redeploy if it ever moves.
var TO = 'mayurk@automatesmall.com';

// Display name on the notification. Without this, some mail clients show the
// bare address, which looks like machine output rather than a message.
var FROM_NAME = 'Mayur Khera';

function doPost(e) {
  try {
    var data = JSON.parse((e && e.postData && e.postData.contents) || '{}');

    // Bots fill hidden fields that humans never see. Accept and discard, so
    // the bot gets a 200 and does not retry.
    if (data.company_website) { return json({ ok: true }); }

    var body = String(data.body || '').slice(0, 20000);
    if (!body.trim()) { return json({ ok: false, error: 'empty' }); }

    var options = {
      to: TO,
      name: FROM_NAME,
      subject: String(data.subject || 'Website enquiry').slice(0, 200),
      body: body
    };

    // Makes Reply go to the visitor rather than to yourself.
    var from = String(data.email || '').trim();
    if (/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(from)) { options.replyTo = from; }

    MailApp.sendEmail(options);
    return json({ ok: true });
  } catch (err) {
    return json({ ok: false, error: String(err) });
  }
}

// Lets you confirm the deployment is alive by opening the URL in a browser.
function doGet() {
  return json({ ok: true, note: 'AutomateSmall form endpoint. POST only.' });
}

function json(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
```

## 2. Deploy it

**Deploy** → **New deployment** → gear icon → **Web app**.

| Field | Value |
|---|---|
| Description | `form v1` |
| Execute as | **Me** |
| Who has access | **Anyone** |

"Anyone" means anyone can POST to the URL. That is required — your visitors
are not signed into your Google account. The URL is unguessable and the script
only ever emails you.

Click **Deploy**. Google asks you to authorise it, and will warn that the app
is unverified because you wrote it yourself: **Advanced** → **Go to
AutomateSmall form (unsafe)** → **Allow**.

Copy the **Web app URL**. It looks like:

```
https://script.google.com/macros/s/AKfycbx.../exec
```

## 3. Check it is alive

Paste that URL into a browser. You should see:

```json
{"ok":true,"note":"AutomateSmall form endpoint. POST only."}
```

## 4. Hand the URL over

Send it to me and I will wire both forms to it, replace the mail-app panel
with a plain thank-you, and rewrite the privacy page in the same commit.

The URL is not a secret in the password sense — it is in the page source, as
every form endpoint is — but do not post it publicly. Anyone with it can send
you email. If it is ever abused, **Deploy → Manage deployments → Archive**
kills it and a new deployment gives you a fresh URL.

## The sender name people actually see

`FROM_NAME` above only affects the notification the script sends **to you**.

When you **reply to a prospect**, the name they see comes from your Google
account, not from anything in this repo. Set it once:

- **Gmail** → Settings → See all settings → **Accounts** → "Send mail as" →
  **edit info** next to `mayurk@automatesmall.com` → set the name to
  `Mayur Khera` → Save.
- **Workspace**, if your admin manages it: Google Admin → Directory → Users →
  your account → the name there is what recipients see.

That is the one that matters commercially. A reply from "Mayur Khera" reads
like a person; one from a bare address reads like a system.

Note that Apps Script can change the display name but not the address it
sends from -- that is always the Google account running the script, unless
you have configured a verified alias in Gmail.

## Changing it later

Edit the script, then **Deploy → Manage deployments → edit → New version**.
Editing without deploying a new version changes nothing.

## Limits

Consumer Gmail sends 100 emails/day from Apps Script; Workspace 1,500. Either
is far beyond what an enquiry form on a new site will use.
