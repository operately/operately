# Conversion tracking

Installation beacons remain unchanged.

## Configuration

| Variable | Default |
| --- | --- |
| `OPERATELY_ANALYTICS_ENABLED` | App: enabled when `POSTHOG_API_KEY` is nonblank. Website: enabled only on `operately.com` and `www.operately.com`. Explicit `false` disables tracking. |
| `OPERATELY_ANALYTICS_TOKEN` | App: `POSTHOG_API_KEY`. Production website: existing project token. Use the same public project token on both surfaces. |
| `OPERATELY_ANALYTICS_HOST` | `https://us.i.posthog.com` |
| `OPERATELY_ANALYTICS_COOKIE_DOMAIN` | `.operately.com` on the production website and when the app's `OPERATELY_HOST` is `app.operately.com`; otherwise host-only. An empty value forces host-only cookies. |

Any installation with a beacon key enables tracking by default; installations 
without one remain disabled.

For local testing, set `OPERATELY_ANALYTICS_ENABLED=true` and
`OPERATELY_ANALYTICS_TOKEN` to a separate test project's public token.
For website/app continuity, use the same project and cookie scope; keep staging
on a separate registrable domain from production. Leave previews disabled.
Restart the app after changing runtime variables; restart the website dev server
or rebuild after changing its variables. Do not use a personal API key.

## Verification

Inspect staging PostHog events and browser requests:

1. Visit `/?utm_source=qa&utm_medium=test&utm_campaign=conversion-v1`, then
   `/help`, then the app. Confirm one sanitized `$pageview` per navigation,
   the same anonymous ID, and unchanged first-touch attribution.
2. Test email, Google, and invitation signup. Expect one `signup_started` per
   attempt and one `signup_completed` per completed new account. Existing-account
   login and invitation provisioning must not count as signup completion.
3. Create a workspace, then a goal/project within seven days. Expect one
   `workspace_created` and one `workspace_activated`, including template projects.
   Later work creation sends no additional conversion events.
4. Check workspace switching, logout, and login on another device: company context
   updates, logged-in visits use the same account ID, and acquisition is unchanged.
5. Verify DNT/GPC and stored opt-outs suppress events, including across open tabs.
   Simulate an ingestion failure: product use must continue and retries must
   preserve event IDs/timestamps without duplicate conversions.
6. Compare PostHog event counts with known test counts.
   Monitor failed `Operately.Analytics.Delivery` jobs and analytics queue age.

## Rollback

Set `OPERATELY_ANALYTICS_ENABLED=false`, restart the app, and rebuild the website.
Leave the database schema and installation beacon configuration unchanged.
Disabled jobs finish without sending; re-enabling does not backfill missed events.
