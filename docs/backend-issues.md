# Message for the backend team

_Last updated: 24 July 2026. I re-probed the live API today:
`/auth/first-login/link/consume` is live and returns the expected shape, but the
captcha `site-key` still has the trailing `ff`, `/public/pages/*` still 500s, the
`/public/tenant/presentation/*` endpoints still 401, and CORS is still off. Items
1–9 were first tested on 21 July; items 10–12 come from reading your
`static/tools/` files, not API tests._

## First-login flow — built to your 9 steps, 2 things still open

Thanks for the step-by-step. I've built the whole flow to match it — link
consume, temp-password login, forced password change — and lined the request
bodies and endpoints up with your screenshots. The parts your message already
covers are handled: the **tenantId comes back from the consume call** (your step
5), the **username + temporary password come from the provisioning email**
(steps 1–2), and the signature header is the **`X-Captcha-Signature`** your
working SSA_FIRST_LOGIN screenshot shows — so I'm not asking about any of those.

Two things are still open before I can run it against the live API:

1. **The "integrated captcha engine" (your step 6).** You said I feed the
   tenantId, username and temporary password into it and it returns the header
   and body variables. The version in your `static/tools/` folder,
   `recaptcha-token.js`, has a blank **"HMAC Secret dev"** field, so on its own it
   can't produce the `X-Captcha-Signature`. **Will you send the wired-up engine
   with that value already filled in, or tell me the secret value to put in that
   field?** This is the one piece blocking a signed login.
2. **A fresh setup email — or mailbox access.** The 21 July link has expired (the
   consume call returns `410 Gone`), so I need a new one to run the flow.
   Whichever is easier: send a fresh provisioning email, **or** give me access to
   the `support@go-worship.com` mailbox so I can pull the setup email myself — and
   any future ones — without waiting each time.

With those two I can run login → forced password change → dashboard live. The
numbered sections below are separate, lower-priority issues I hit while
integrating (some may already be resolved by the captcha engine above).

_FYI, not a question: I've used `X-Captcha-Signature` / `X-Captcha-Ts` to match
your working screenshot (`recaptcha-token.js` emits `X-Tenant-Signature`
instead); flag me only if the server actually reads a different header._

---

Hi team — I'm wiring the web client up to the API and hit a few things I can't
fix from my side. Roughly in order of urgency:

1. The captcha site key is invalid — this blocks all login and signup.
2. All four `/public/pages/*` endpoints return 500.
3. All twelve `/public/tenant/presentation/*` endpoints return 401.
4. Which environment should I be pointing at?
5. A few QA-guide paths don't match the deployed API.
6. Two sign-up fields I need guidance on.
7. CORS is off — I've worked around it, no action needed.
8. Auth signature — built; see the first-login summary at the top for the two open points.
9. What the `subscription` block should do to the UI.
10. Payments — the design shows an in-app card form, but your tool uses a hosted redirect. Which do I build?
11. Google login — the contract is clear; is it in scope for this web client?
12. MFA — I have the enrollment endpoint; I need the login-challenge endpoints.

Items 10–12 aren't blocking me today — I'm flagging them now so you can tell me
how you want them handled before I wire up payments and multi-factor auth.

Thanks for the QA Postman guide — it resolved several questions I'd have had
to ask, and it's what told me the captcha goes in `X-Captcha-Token` rather
than the body.

---

## 1. The captcha site key is invalid (blocks all login and signup)

`GET /api/v1/auth/captcha/site-key` returns this key:

```
6LfbSHAsAAAAAFnhtf-lPAKUG83fUiXdFPLsxzMxff
```

It is **42 characters long. Google reCAPTCHA keys are exactly 40.** There are
two extra characters (`ff`) on the end, so Google rejects it and the widget
shows "ERROR for site owner: Invalid site key". I tested the first 40
characters on their own and Google accepts them, so I think it's just a typo
in the config value.

**Please check the configured key and remove the extra `ff`.**

While you're in there, could you also confirm the key is registered in the
Google reCAPTCHA admin for these domains:

- `go-worship-client.netlify.app` (the demo site)
- `localhost` (for development)

If those domains aren't on the key, it will still fail after the typo is fixed.

**Why this is blocking:** every public endpoint requires a captcha token —

```
# no captcha header
curl -X POST https://www.go-worship.com/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"member1@rccg.org","password":"...","timestamp":1784657440078,
       "nonce":"3e35418dc755431abb704fb889c7b4d0","rememberMe":true}'
{"code":"CAPTCHA_MISSING","message":"Captcha token is required","ok":false}

# with X-Captcha-Token set to any placeholder value
{"code":"CAPTCHA_ERROR","message":"Captcha verification error...",
 "details":{"message":"Captcha not successful: [invalid-input-response]"}}
```

The second response is Google's own `invalid-input-response`, so the token is
reaching Google and being rejected there — which is consistent with the key
itself being malformed rather than anything wrong on your side of the call.

Until the key works, nobody can log in, sign up, or reset a password from the
web client.

To reproduce:
```
curl https://www.go-worship.com/api/v1/auth/captcha/site-key
```

---

## 2. All four `/public/pages/*` endpoints return 500

```
GET /api/v1/public/pages/landing        -> 500
GET /api/v1/public/pages/tenant-login   -> 500
GET /api/v1/public/pages/system-login   -> 500
GET /api/v1/public/pages/get-started    -> 500
```

All four return the same generic body:

```json
{"status":500,"error":"Internal Server Error",
 "errorCode":"INTERNAL_SERVER_ERROR",
 "message":"An unexpected error occurred. Please contact support if the problem persists."}
```

Since it's the whole controller rather than one endpoint, I suspect a single
common cause. My guess is tenant resolution: I'm calling with no login and no
tenant subdomain, so my requests arrive at `www.go-worship.com`.

**If these need a tenant subdomain in the host, please tell me which subdomain
to call** and I'll point my server at it. If they're meant to work without
one, there may be a null-tenant bug — the stack trace in your logs would show
it straight away.

---

## 3. All twelve `/public/tenant/presentation/*` endpoints return 401

Every endpoint under this path returns
`401 "Authentication is required to access this resource"`:

```
/api/v1/public/tenant/presentation/branding       -> 401
/api/v1/public/tenant/presentation/home           -> 401
/api/v1/public/tenant/presentation/navigation     -> 401
/api/v1/public/tenant/presentation/events         -> 401
/api/v1/public/tenant/presentation/giving         -> 401
/api/v1/public/tenant/presentation/sermons        -> 401
/api/v1/public/tenant/presentation/footer         -> 401
/api/v1/public/tenant/presentation/site-template  -> 401
```

They're under `/public/` and the docs describe them as public (e.g. "Get
public tenant branding payload"), so I think requiring auth is unintended.
For contrast, `POST /api/v1/public/customers/register` **is** reachable without
a token — it returns a normal validation error — so the `/public/` prefix
isn't uniformly open at the moment.

**Could you confirm whether these are meant to be reachable without a login?**
I need the branding one in particular to theme the tenant login page.

---

## 4. Which environment should I point at?

Thanks for the QA Postman guide — it answered a lot. One thing I couldn't
resolve from it: the base URLs in section 5 are

```
http://www.go-worship.com:8585/go-worship
http://www.rccg.org:8585/go-worship
http://rccg.go-worship.com:8585/go-worship
```

Port 8585 with a `/go-worship` context path. **I can't reach any of those from
outside.** `rccg.go-worship.com` resolves in DNS but nothing answers over
HTTPS, and `www.rccg.org` is an unrelated live site.

What I *can* reach is `https://www.go-worship.com/api/v1/...` — no port, no
context path — which is what I've been building against.

**Is the QA environment reachable from outside, and if so at what URL?** If
not, are the section 7 test accounts (e.g. `member1@rccg.org`) also valid on
`www.go-worship.com`? I couldn't check, because login needs a captcha token and
the site key is broken (issue 1).

Also, I tried `X-Tenant-Id: 01KMTS860VEJ4E35XSKPPW5B40` from the guide against
`www.go-worship.com` and still got 401 on the presentation endpoints in issue 3
— so that header alone doesn't seem to resolve the tenant there.

---

## 5. A few QA-guide paths don't match the deployed API

Small one, in case the guide needs a refresh. These paths from the guide don't
exist in the live OpenAPI spec, though a near-equivalent does:

| QA guide | Live API |
|---|---|
| `/auth/guest-otp/start` | `/auth/guest/otp/start` |
| `/auth/guest-otp/verify` | `/auth/guest/otp/verify` |
| `/system/tenants/provision` | `/system/tenants/indirect` |
| `/tenant/admin/users/customers/provision` | `/tenant/admin/users/customers` |
| `/tenant/admin/users/provision` | not found |
| `/tenant/admin/users/guests/upgrade-to-customer` | not found |

I'm following the live spec for these. Just flagging it so the next person
using the guide doesn't lose time.

Related: `/auth/login` and `/auth/google` aren't in the OpenAPI spec at all —
I assume because they're filters rather than controllers. That's fine now that
I have the guide, but it does mean the spec alone isn't enough to integrate
login. Worth a note in the spec if that's easy.

---

## 6. Sign-up form: two questions

The member sign-up screen asks for: first name, last name, email, phone
number, church, church position, gender and location.

The guide cleared up most of it — I'm now sending the full email as
`username` and Church Position as `profile.jobTitle`, matching your TC-014
example. **Church** is the tenant and resolved from the domain, so I show it
read-only and don't send it. Two things still open:

**a) Campus — can I set it at sign-up?**
"Location" on the form is a campus picker (Campus 1, Campus 4, Zone 2, Head
Quarters). I can see `UserAccount.campus` in the model, so the association
already exists. Two things stop me from setting it:

- `CustomerProvisionRequest` has no `campusId` field, and
- the only campus list I can find is `GET /api/v1/tenant/admin/campuses`,
  which a signed-out visitor can't call.

**Could I get a `campusId` on the registration request, plus a public endpoint
listing the current tenant's campuses?** If members are instead meant to be
assigned a campus later by an admin, tell me and I'll drop the field from
sign-up.

**b) Gender — is there somewhere for it?**
I couldn't find a gender field anywhere in the API. Is it deliberately not
stored? If it should be, it would need adding to the profile. If it shouldn't,
I'll take it off the form — I'd rather not ask users for something I then throw
away.

---

## 7. CORS is off — no action needed

A browser can't call the API directly, because responses carry no
`Access-Control-Allow-Origin`. A preflight is rejected outright:

```
curl -i -X OPTIONS https://www.go-worship.com/api/v1/auth/login \
  -H "Origin: https://go-worship-client.netlify.app" \
  -H "Access-Control-Request-Method: POST"
```
→ `403`. The response does carry `Vary: Origin` and
`Vary: Access-Control-Request-Method`, but no `Access-Control-Allow-*` headers,
so the browser blocks the request.

**I've already worked around this** — the web client now routes API calls
through its own server instead of calling you from the browser. So this isn't
blocking me, and **no action is needed unless you intended browsers to call the
API directly**, or unless a mobile/other browser client is coming later.

---

## 8. Auth signature — built; the open points are in the summary up top

Thanks for pointing me to `recaptcha-token.js`. That, plus your SSA_FIRST_LOGIN
screenshot, is what I built the signed login against:

- reCAPTCHA **v3** (`api.js?render=` + `grecaptcha.execute(key,{action})`), token
  minted on submit.
- Signature = `base64(HMAC-SHA256(secret, "<tenantId>:<ts>:/api/v1/auth/login:POST"))`,
  computed server-side (never in the browser).

The two open points here are the ones in the summary at the top of this note:
(a) the **"integrated captcha engine"** from your step 6 and how its HMAC secret
gets populated (its "HMAC Secret dev" field is blank in the static file), and
(b) the **signature header name** — `X-Captcha-Signature` (your working
screenshot, which returned a 428) vs `X-Tenant-Signature` (`recaptcha-token.js`).
I've built to the screenshot; just confirm it's the one the server reads.

To be clear, I'm **not** asking for a tenantId (it comes back from the consume
call, your step 5) or for test credentials (they're in the provisioning email,
steps 1–2) — I have those covered. If you'd rather just hand over the wired-up
HTML/JS for this exchange, send it and I'll drop it in directly.

---

## 9. What should the `subscription` block do to the UI?

The successful login response includes:

```json
"subscription": {
  "show": false, "blocked": false, "minimalAccess": false,
  "status": "ACTIVE", "showUpgradeCta": false, "fullAccess": true
}
```

I'm passing it through to the frontend but haven't built any behaviour off it,
because I don't want to guess. Could you confirm what each flag should do?

- `blocked: true` — block the app entirely and show what?
- `minimalAccess: true` — which parts stay usable?
- `showUpgradeCta: true` — where should the upgrade prompt appear?
- `show` — is this "show the subscription section in settings"?

A one-line description per flag is plenty; I'll build to it.

---

## 10. Payments — the design has an in-app card form, but your tool uses a hosted redirect

Your `static/tools/leadremit-checkout.html` shows the real giving/payment flow
is a **hosted redirect** through LeadRemit / CollectCheckout
(`CollectCheckout.redirectToCheckout(...)` with a `customPayment` line item),
configured by:

```
GET /api/v1/public/payments/leadremit/checkout-config/{paymentRef}
      ?tenantId=…&invoiceId=…&subscriberId=…
  -> { paymentReference, successUrl, cancelUrl, qrCodeUrl,
       checkoutScriptUrl, checkoutPublicKey }
```

With that flow, the member enters the amount and card details **on the gateway
page**, not in the app.

The Figma design, though, shows an **in-app** Card / Transfer / Bank / USSD form
where the member types their card number into the app's own screen. The two
don't line up — I can't collect real card details in-app against a
hosted-redirect gateway.

**How would you like the web client to take payments?**
- **Option A** — I switch the giving/checkout flow to redirect to the LeadRemit
  hosted page (matches your tool). The in-app form becomes a "choose method →
  redirect" step.
- **Option B** — the in-app form is the intended UX and there's a separate
  tokenized-card API I should call instead.

Right now I've kept the design's in-app form for the demo and haven't wired any
live payment, so nothing is broken — I just need your steer before wiring it.

---

## 11. Google login — the contract is clear; is it in scope for this client?

Your token tool also covers Google login: `POST /api/v1/auth/google`, action
`google_login`, body `{ idToken, timestamp, nonce, captchaToken, proof }`, with
the same `X-Tenant-*` signing as `/auth/login`. It can return either tokens or an
**MFA-required** response (`mfaSessionId` / `allowedMethods`). The Google client
id in the tool is `186971327364-…apps.googleusercontent.com`.

I've matched my server login route to the custom-login contract, but I haven't
built a Google route yet. **Is Google sign-in in scope for this web client?** If
yes, I'll add a server route mirroring `/auth/login` (and I'll need that client
id to match `SECURITY_GOOGLE_CLIENT_ID`). If no, I'll leave the button out rather
than ship a dead one.

---

## 12. MFA — I have the enrollment endpoint; I need the login-challenge endpoints

Your `mfa-debug` tool documents MFA **enrollment** clearly:
`POST /api/v1/self/security/mfa/enrollment/complete` (Bearer + `X-Tenant-Id`),
methods TOTP / OTP_EMAIL / OTP_SMS, with bodies
`{ method, code, secret, makePreferred }` (TOTP) or
`{ method, tokenId, code, makePreferred }` (email/SMS).

What I don't have is the **login-time** MFA step — when `/auth/login` returns a
challenge instead of tokens. My client currently calls placeholder paths
`/auth/mfa/begin` and `/auth/mfa/verify` that I guessed. **What are the real
endpoints and request/response shapes for issuing and verifying an MFA challenge
during login?** Not urgent — login is still blocked on the captcha key and the
HMAC secret (issues 1 and 8) — but I'll need it to finish the MFA path.

---

## What I need most

**A working captcha site key** (issue 1) and **confirmation of which
environment and accounts to use** (issue 4).

With those two, I can verify every signed-in screen. Without them everything
behind login stays on placeholder data — the captcha blocks login entirely, so
I can't even check whether the section 7 accounts work.

Thanks!
