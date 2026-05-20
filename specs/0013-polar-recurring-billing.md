# Polar Recurring Billing for Cloud Plans

## Summary

Enable recurring billing for Operately Cloud using Polar.

The integration should be company-scoped, not account-scoped:

- `free` remains an internal Operately plan
- `team` and `business` become Polar-backed recurring subscriptions
- one Polar customer maps to one Operately company
- billing is managed by company owners from Company Admin

This spec covers the full path from pricing-page intent, through signup and company creation, into a remembered upgrade preference, later Polar checkout from the billing surface, webhook synchronization, subscription-management actions, a feature-flagged rollout, and final-step enforcement of plan limits such as member count and storage.

## Current State

- The website pricing page is a marketing-only page and currently sends users to signup with `?plan=...`.
- Signup and company creation do not persist or use plan selection today.
- The app has no billing domain model, no checkout flow, no webhook endpoint, and no billing UI.
- Company Admin copy already implies that owners manage billing, but there is no implementation behind it yet.

## Scope

### In scope

- Polar-backed recurring billing for `team` and `business`
- company-level billing state in the Operately app
- remembered paid-plan intent through signup and company creation without immediate payment
- checkout creation from explicit upgrade actions in the app
- webhook-driven billing synchronization
- full billing-management actions in the app, including upgrade, cancel, and payment-method update entry points
- plan-limit enforcement, including member-count and storage limits, delivered only after all billing and subscription flows are complete
- paid-plan intent propagation through email signup, login, Google OAuth, and direct logged-in handoff into the app billing surface

### Out of scope

- self-hosted licensing workflows
- usage-based billing
- seat-based billing

## Important Decisions

### 1. Billing belongs to `company`, not `account`

Subscriptions should attach to the workspace/company because pricing is presented as a team plan, ownership is company-level, and enforcement applies to company membership.

### 2. `free` remains internal

Only paid plans need Polar. Companies without an active paid subscription remain on `free` by default.

### 3. One Polar customer per company

Use `company.id` as the stable external identifier for Polar customer records. This keeps reconciliation simple and allows webhook sync to target a single company deterministically.

### 4. Polar products are interval-specific and versionable

Model these as separate Polar products:

- `team-monthly`
- `team-yearly`
- `business-monthly`
- `business-yearly`

The Operately app owns the human-friendly plan catalog. Polar owns recurring billing for the paid products.

Editing price for a Polar product should be treated as a pricing-policy decision:

- if new users should see the new price while existing subscribers keep the old price, updating the product price is acceptable
- if the business wants explicit versioning and clearer operational control, create a new product version and archive the previous one for new purchases
- if existing subscribers should move to a new price immediately or at the next renewal, the app should support migrating subscriptions to a new Polar product explicitly rather than assuming product edits will do that

### 5. The app should own a local billing catalog synced from Polar

The website should never hardcode Polar product IDs.

Instead:

- the website passes only semantic intent such as `plan=team` and `billing_period=monthly`
- the app resolves that intent to the currently active Polar product using a local billing catalog
- the local catalog is synchronized from Polar and exposed in a site-admin billing screen

This keeps the public website decoupled from provider IDs and allows future product additions without website code changes beyond selecting the desired plan family and interval.

### 6. Website-selected plan should be remembered, not charged immediately

If a user picks a paid plan on the website, the app should not force checkout immediately after signup or company creation.

Instead:

- the selected plan and billing interval should be preserved through auth
- when the user creates a company, that selection becomes a remembered company-level upgrade preference
- the company starts on `free`
- the billing page and free-limit prompts should preferentially recommend the remembered plan later

This keeps signup friction low while still preserving commercial intent from the marketing site.

### 7. Website-selected paid intent should land on an app-owned entry route

The website should not decide up front whether a paid CTA goes to signup or to the billing page. That branching should happen inside the app.

Suggested flow:

- the website sends paid traffic to an app-owned billing-intent route, for example:
  - `/billing/intent?plan=team&billing_period=monthly`
- if the visitor is not authenticated, that route redirects to signup or login with a `redirect_to` back to the same billing-intent route
- if the visitor is already authenticated and has a current company context, that route redirects directly to that company's billing page with the selected plan and interval preloaded
- if the visitor is authenticated but does not yet have a company, that route redirects to `/new?plan=team&billing_period=monthly`

`redirect_to` is still the correct mechanism for the unauthenticated continuation path, but it should no longer be the website's only entrypoint.

This allows:

- signup with email
- login with password
- signup/login with Google OAuth
- already-logged-in owners coming from the website

to all converge on the same post-auth destination.

### 8. Webhooks should sync normalized customer state

Treat Polar as the source of truth for paid subscription status. When a relevant webhook arrives, fetch the latest normalized customer state from Polar and mirror it locally.

This is preferred over manually reconstructing local state from multiple raw subscription and invoice-like events.

### 9. Plan limits must be enforced in backend operations

Plan limits cannot live only in the UI. The app has multiple write paths for membership changes and file creation, so member-count and storage enforcement both need backend/domain enforcement at the relevant operations, even though that enforcement should ship only in the final rollout step.

### 10. Billing management is owner-only

Company owners should be allowed to start checkout, change plans, cancel subscriptions, reactivate pending cancellation, update payment method, and trigger a sync refresh. Non-owners should not mutate billing state.

### 11. Operately owns decision flows; Polar owns secure payment flows

The app should not dump users into a generic provider portal as the primary experience.

Instead:

- Operately owns the billing overview, plan selection, downgrade confirmation, and cancellation confirmation flows
- Operately redirects to Polar only when secure provider-hosted payment steps are needed, such as:
  - entering or confirming card details
  - confirming a paid subscription through checkout
  - updating a payment method through a hosted card-management flow
- a generic provider-managed portal may still exist as an operational fallback, but it is not the primary UX

### 12. The billing rollout should be feature-flagged end to end

The implementation should use the app's existing experimental-feature pattern so PRs can merge without affecting normal companies.

Use the existing company-scoped feature-flag mechanism:

- backend feature checks via `Operately.Companies.has_experimental_feature?/2`
- frontend feature checks via `Companies.hasFeature(company, "billing")`
- persisted flag storage via `company.enabled_experimental_features`

Suggested feature flag name:

- `billing`

While the `billing` feature flag is disabled for a company:

- no Billing navigation item is shown
- no billing page is reachable from normal UI flows
- no remembered-plan hints or billing prompts are shown
- no new checkout, cancellation, or payment-method UI is shown
- no new limit enforcement behavior is applied
- website `plan` and `billing_period` query params should be ignored and the existing signup flow should behave exactly as it does today

This allows all intermediate PRs to land safely.

### 13. Limit enforcement must ship last

All hard limit enforcement should be the final implementation step, after:

- product catalog sync
- remembered-plan signup flow
- billing page UX
- checkout handoffs
- payment-method handoffs
- webhooks and state synchronization

This sequencing applies to:

- member-count limits
- storage limits
- any future plan-governed limits

The system should not start blocking user actions until the billing and subscription flows are complete and the launch is ready.

## Plan Catalog and Entitlements

The Operately app should define a first-party plan catalog, for example:

- `free`: member limit `20`, storage limit `1 GB`
- `team`: member limit `50`, storage limit `100 GB`
- `business`: member limit `200`, storage limit `1 TB`

Suggested module:

- `Operately.Billing.Plans`

This module should return entitlement-level data:

- plan key
- display name
- member limit
- storage limit in bytes
- any future limit keys that should be enforced from plan entitlements rather than hardcoded thresholds

Suggested separate module:

- `Operately.Billing.ProductCatalog`

This module should resolve purchasable products:

- plan family such as `team` or `business`
- billing interval such as `monthly` or `yearly`
- current active Polar product ID for that combination
- display price and currency for admin visibility
- product version and archived state

Companies without a billing row should behave as `free`.

If a company was created from a website-selected paid plan, the billing state should also remember:

- suggested plan key
- suggested billing interval
- source of that suggestion, such as website pricing page

This remembered preference does not change entitlements by itself. It is used only for upgrade recommendations and default plan selection in the billing UI.

### Local billing catalog

Add a local synced catalog of Polar products instead of relying on env vars for product selection.

Suggested schema: `billing_products`

Suggested fields:

- `provider` with value `polar`
- `plan_family`
- `billing_interval`
- `polar_product_id`
- `polar_product_name`
- `price_amount`
- `price_currency`
- `version`
- `active`
- `archived_at`
- `provider_payload`
- `last_synced_at`

Expected behavior:

- products are created and managed in Polar
- Operately syncs them into `billing_products`
- Operately operators choose which product is the active product for a given `plan_family + billing_interval`
- checkout resolution uses the active local catalog entry, not a hardcoded ID

This allows future products or product versions to be added in Polar first, then surfaced and activated from the Operately admin panel.

## Pricing Changes and Product Versioning

The spec should support both price-grandfathering and price-migration workflows.

### 1. New price for new customers only

When the business wants existing subscribers to keep their current price:

- a Polar product price can be edited for new purchases only, or
- a new versioned Polar product can be created and marked active in Operately while the previous one is archived for new checkout

The preferred Operately policy is:

- use explicit product versioning when pricing changes are material or when operator clarity matters
- treat the previous product as legacy but still renewable for existing subscribers

### 2. New price for existing customers too

When the business wants to move existing subscribers to a new price:

- create or select the target Polar product version
- migrate selected subscriptions to that new product
- choose the intended timing policy explicitly, such as immediate change, prorated change, or next-period change

This migration should be a deliberate operator action, not an incidental side effect of editing catalog entries.

## UX Patterns from Existing Products

Mobbin references used for this spec showed a strong common pattern across mature SaaS billing experiences:

- a dedicated billing home with current plan, next renewal, payment method summary, and clear action buttons
- an in-app plan comparison or plan-selection step before any hosted checkout handoff
- a simple monthly/yearly toggle close to the plan decision
- a clear cancellation confirmation that explains effective date and what the user loses
- targeted redirects into secure provider-managed payment flows only when card entry or payment confirmation is required

Representative references:

- Miro billing overview: https://mobbin.com/screens/88eca983-a02d-479e-a088-08adcef509e9
- Motion billing overview with direct actions: https://mobbin.com/screens/05f57e53-4c07-4ee8-82f2-92c2f303cdaa
- 1Password billing home with plan and payment method summary: https://mobbin.com/screens/627dea90-1ab4-4d0c-81c4-bedf6ca67532
- Jasper billing with separate edit plan and payment details actions: https://mobbin.com/screens/425a2408-043c-40c5-9bc6-28d66296b4bc
- Figma plan picker with current-plan state and monthly/yearly toggle: https://mobbin.com/screens/405db39d-09f3-47d0-8b07-f3469997c79f
- VEED plan selection with billing-period choice before payment: https://mobbin.com/screens/44a280b0-7c07-4a82-b78f-f7bbfb5eb894
- Render downgrade confirmation with explicit consequences: https://mobbin.com/screens/c40d1c35-9a72-45eb-bd52-55a9ed4e24a0
- Calendly downgrade confirmation with effective-date clarity: https://mobbin.com/screens/7931acd1-d324-42b7-92d2-0a3245895f84
- Cloudflare cancellation confirmation with explicit end-of-access messaging: https://mobbin.com/screens/1025753d-8aa3-48d5-90b5-96cef32ebc33

Derived UX principles for Operately:

- keep one canonical `Billing` home for all subscription actions
- let owners decide `team` vs `business` and `monthly` vs `yearly` inside the app before checkout
- surface the remembered suggested plan from the website as the default recommendation, not as a forced choice
- never hide cancellation, but always explain the post-cancellation limits of the free plan
- keep provider redirects narrow and intentional

All user flows below assume the `billing` experimental feature is enabled for the company. When the flag is disabled, the existing non-billing behavior should remain unchanged.

## User Flows

### 1. Unauthenticated visitor selects a paid plan on the website

1. User clicks a paid CTA on the website.
2. CTA links to an app-owned billing-intent route with `plan` and `billing_period`.
3. The user is not authenticated, so the app redirects to signup or login with a `redirect_to` back to the same billing-intent route.
4. User signs up or logs in.
5. App returns the user to the billing-intent route.
6. Because the user still has no company, the app redirects to `/new?plan=...&billing_period=...`.
7. User creates a company.
8. Company creation persists the selected plan and billing interval as a remembered upgrade preference on the company billing record.
9. The company starts on `free` with no immediate checkout requirement.
10. The app may show a non-blocking billing hint or simply rely on the Billing page and future limit prompts to surface the remembered upgrade path.

### 2. Existing account, no company, paid website intent

1. User clicks a paid CTA on the website.
2. The billing-intent route sees an authenticated user with no company yet.
3. The app redirects directly to `/new?plan=...&billing_period=...`.
4. Company creation stores the remembered upgrade preference and starts the company on `free`.

### 3. Logged-in owner clicks a paid CTA on the website

1. User clicks a paid CTA on the website while already logged in to Operately.
2. The billing-intent route resolves the user's current company context.
3. The app redirects directly to `/:companyId/admin/billing` with the selected `plan` and `billing_period`.
4. The billing page opens with that plan and billing interval preselected in the in-app plan-selection flow.
5. No checkout session is created yet.
6. The owner can confirm the selection, change it, or leave without any billing mutation.

### 4. Owner upgrades from inside the app

1. Owner opens `Company Admin -> Billing`.
2. The billing page highlights the remembered plan and interval if one exists, but still allows the owner to choose another plan.
3. Owner clicks `Upgrade` or `Change plan`.
4. Operately opens an in-app plan-selection flow.
5. The plan-selection flow shows:
   - `Team` and `Business` plan cards
   - a monthly/yearly toggle
   - current-plan badge
   - remembered recommended plan badge when relevant
   - concise feature and limit summary
   - a short “what happens next” summary before checkout
6. Owner chooses the target plan and clicks `Continue to checkout`.
7. App creates a Polar checkout session for the selected target plan for the existing company.
8. User is redirected to Polar checkout.
9. After return and webhook sync, the billing page reflects the new paid state.

### 5. Owner manages an active subscription from the billing page

1. Owner opens `Company Admin -> Billing`.
2. The page exposes explicit actions for:
   - upgrading or changing plan
   - canceling the subscription
   - reactivating a pending cancellation
   - updating the payment method
   - reviewing billing status and renewal timing
3. Each action begins with an in-app Operately-owned flow that explains the consequence of the action before any provider redirect or API mutation occurs.
4. Where Polar supports direct API-driven changes, Operately executes them from named in-app actions.
5. Where Polar requires a hosted payment-management flow, the in-app action launches that secure provider-managed flow and returns the user to the billing page.
6. Polar webhooks synchronize resulting state changes back into Operately.

### 6. Owner manages payment method

1. Owner clicks `Update credit card` or equivalent from the billing page.
2. Operately shows a lightweight in-app handoff state explaining that card details are handled securely by Polar.
3. Backend creates the appropriate secure Polar-hosted payment-method management session.
4. User completes the update flow.
5. App returns the user to the billing page and refreshes billing state.

### 7. Upgrade is attempted later and checkout is abandoned or fails

1. Company is already active on `free` or on an existing paid plan.
2. Owner explicitly starts an upgrade or plan-change checkout from the billing page.
3. The user does not complete payment, or the checkout expires or fails.
4. The company remains on its last confirmed plan.
5. Operately records the pending target plan and the most recent checkout attempt details.
6. The owner can later return to the billing page and click `Complete upgrade` or `Retry checkout`.
7. Operately creates a fresh checkout session and redirects the owner back to Polar.

If the company had not yet upgraded successfully, it remains on `free`.

### 7. Company hits member limit

1. An operation tries to add, restore, or create an active company member beyond the plan limit.
2. Backend rejects the operation with a billing-limit error.
3. UI surfaces a message directing owners to upgrade in Company Admin.
4. If the company has a remembered website-selected plan, that plan should be the default recommendation in the upgrade prompt.

### 8. Owner cancels a subscription

1. Owner opens the billing page and clicks `Cancel plan`.
2. Operately opens an in-app cancellation confirmation flow.
3. The confirmation flow explains:
   - when access ends
   - what free-plan limits apply after cancellation
   - whether the company is currently above those free-plan limits
   - that invitations/restores may be blocked after downgrade if the company remains above the free limit
4. The flow may collect optional cancellation feedback, but feedback must not be required to cancel.
5. Owner confirms cancellation.
6. Operately submits the cancellation action directly or launches the provider-managed cancellation flow, depending on Polar capabilities used in implementation.
7. The billing page reflects `cancel_at_period_end` or equivalent canceled state after sync.
8. The company keeps access through the current billing period and then returns to the appropriate downgraded state.

### 9. Owner reactivates a subscription scheduled for cancellation

1. Owner opens the billing page while `cancel_at_period_end` is true.
2. Owner clicks `Keep plan` or `Reactivate`.
3. Operately clears the pending cancellation through Polar.
4. Webhook sync updates local state.

## Architecture

### Persisted state

Add a dedicated billing table instead of storing provider fields directly on `companies`.

The local database should store a thin operational projection, not a full mirror of Polar.

Persist locally only what Operately needs for:

- entitlement checks and future limit enforcement
- routing and feature-flagged UI decisions
- remembered upgrade intent from the website
- rendering a useful billing page even if Polar is temporarily slow or unavailable
- idempotent webhook handling and basic operational debugging

Provider-native details that Polar already owns well should generally be fetched on demand instead of mirrored locally. That includes:

- invoice and receipt history
- payment-method details
- full checkout objects
- full customer-state payloads
- full subscription/order history

Suggested schema: `company_billing_accounts`

Suggested fields:

- `company_id`
- `provider` with value `polar`
- `plan_key`
- `billing_interval`
- `status`
- `suggested_plan_key`
- `suggested_billing_interval`
- `suggested_plan_source`
- `current_period_end`
- `cancel_at_period_end`
- `pending_plan_key`
- `pending_billing_interval`
- `pending_checkout_started_at`
- `last_synced_at`

Suggested status values:

- `free`
- `active`
- `past_due`
- `canceled`

Notes:

- Do not persist full checkout sessions by default. Checkout URLs are disposable and fresh sessions can be created when needed.
- Do not persist `raw_customer_state` in the primary billing table by default. Normalize the few fields Operately actually uses and keep the rest in Polar.
- Do not require `polar_customer_id` or `polar_subscription_id` for the primary design. Polar supports customer lookup by external ID, and active subscription details can be fetched live when needed.
- If a provider ID later proves operationally useful, treat it as an optional cache/debug field, not as the source of truth.

Add a separate webhook idempotency table.

Suggested schema: `billing_webhook_events`

Suggested fields:

- `provider`
- `event_id`
- `event_type`
- `payload`
- `received_at`
- `processed_at`
- `status`
- `error`

`provider + event_id` should be unique.

Webhook payload retention is still useful for debugging and replay safety, but it should be treated as operational data with a retention policy rather than as canonical billing state.

### Data loading strategy

Use a hybrid approach:

- render the default billing page from the local billing projection
- use webhook sync plus owner-triggered refresh to keep that projection current
- fetch provider-native details from Polar on demand when the user opens flows that need them

Suggested on-demand Polar reads:

- `customer state by external ID` for the freshest subscription snapshot before sensitive mutations or manual refresh
- customer-session / customer-portal APIs for invoices, receipts, and payment-method-related displays
- checkout-session creation only at the moment the owner explicitly continues to Polar

This keeps Operately resilient and fast for normal reads while avoiding unnecessary duplication of provider-owned billing data.

### Backend modules

Suggested modules:

- `Operately.Billing`
- `Operately.Billing.CompanyBillingAccount`
- `Operately.Billing.ProductCatalogEntry`
- `Operately.Billing.WebhookEvent`
- `Operately.Billing.Plans`
- `Operately.Billing.ProductCatalog`
- `Operately.Billing.Polar.Client`
- `Operately.Billing.Polar.Checkout`
- `Operately.Billing.Polar.ProductSync`
- `Operately.Billing.Polar.SubscriptionManager`
- `Operately.Billing.Polar.PaymentMethodSession`
- `Operately.Billing.Polar.CustomerPortal`
- `Operately.Billing.Polar.WebhookVerifier`
- `Operately.Billing.Polar.CustomerStateSync`
- `Operately.Billing.Polar.ProcessWebhookWorker`
- `Operately.Billing.Flows.PlanSelection`
- `Operately.Billing.Flows.Cancellation`

Responsibilities:

- `Plans`: internal plan catalog and product lookup
- `ProductCatalog`: local synchronized purchasable-product registry and active-product resolution
- `Client`: outbound HTTP requests to Polar via `Req`
- `Checkout`: create checkout sessions for paid plans
- `ProductSync`: pull products from Polar into the local billing catalog
- `SubscriptionManager`: direct subscription lifecycle actions such as change plan, cancel, and reactivate
- `PaymentMethodSession`: create secure hosted sessions for payment-method updates where required
- `CustomerPortal`: fallback provider-managed management entrypoint for actions not implemented directly
- `WebhookVerifier`: verify Polar webhook signatures
- `CustomerStateSync`: fetch and persist normalized Polar customer state
- `ProcessWebhookWorker`: idempotent async webhook processing via Oban
- `PlanSelection`: in-app decision model for choosing target plan and interval before checkout
- `Cancellation`: in-app decision model for downgrade consequences and cancellation confirmation

### Feature-flag integration

The billing system should integrate with the existing experimental-feature pattern already present in the app.

Relevant existing pieces:

- `company.enabled_experimental_features`
- `Operately.Companies.enable_experimental_feature/2`
- `Operately.Companies.disable_experimental_feature/2`
- `Operately.Companies.has_experimental_feature?/2`
- `app/assets/js/models/companies/hasFeature.tsx`

Requirements:

- all company-facing billing UI must check the `billing` feature flag
- company-scoped billing API endpoints should reject or no-op when the feature is disabled
- signup/company-creation remembered-plan behavior should only activate when the feature is enabled
- limit enforcement must be gated the same way until the launch PR removes the flag

### Phoenix routes and controller surface

Add a dedicated webhook route instead of placing Polar callbacks inside the existing external API surface.

Suggested route:

- `POST /webhooks/polar`

Suggested controller:

- `OperatelyWeb.PolarWebhookController`

Suggested pipeline behavior:

- JSON only
- no session auth
- raw-body access for signature verification

### Internal app API

Add owner-scoped internal billing endpoints for the React app.

Suggested operations:

- `billing/get`
- `billing/create_checkout_session`
- `billing/preview_plan_change`
- `billing/change_plan`
- `billing/preview_cancellation`
- `billing/cancel`
- `billing/reactivate`
- `billing/create_payment_method_session`
- `billing/create_customer_portal_session`
- `billing/refresh`
- `billing/catalog/list`
- `billing/catalog/sync`
- `billing/catalog/set_active`

Expected behavior:

- `get`: returns normalized company billing state plus plan metadata and current member count
- `preview_plan_change`: returns the Operately-owned pre-checkout summary for a requested target plan and interval, including the current plan, target plan, remembered recommendation, effective timing, and expected handoff copy
- `create_checkout_session`: validates ownership, resolves the active local catalog entry for the selected plan and interval, and creates a Polar-hosted checkout for plan transitions that require secure payment confirmation
- `change_plan`: applies or schedules plan changes that do not require a new checkout, such as downgrade-at-period-end flows when supported by the provider integration
- `preview_cancellation`: returns the effective cancellation date, post-cancellation free-plan limits, and warnings if the company is above the future free-plan limit
- `cancel`: cancels the active subscription, typically at period end unless implementation explicitly supports immediate cancellation
- `reactivate`: clears pending cancellation when allowed by Polar
- `create_payment_method_session`: validates ownership and returns a redirect URL for secure payment-method updates
- `create_customer_portal_session`: validates ownership and returns a redirect URL as a fallback provider-managed management entrypoint
- `refresh`: owner-triggered sync path used after checkout success or for manual repair
- `catalog/list`: site-admin-only list of synchronized Polar products and active mappings
- `catalog/sync`: site-admin-only sync from Polar into `billing_products`
- `catalog/set_active`: site-admin-only action to choose the active product for a `plan_family + billing_interval`

All company-scoped billing endpoints should validate that the `billing` feature is enabled for the current company before applying any new behavior.

### Polar configuration

Add runtime configuration for:

- `POLAR_ACCESS_TOKEN`
- `POLAR_WEBHOOK_SECRET`
- `APP_URL` or equivalent canonical Operately app base URL used for return URLs

Product IDs should come from the synchronized local billing catalog, not from env vars.

## Signup and Company Creation Plumbing

### Website changes

The pricing page in the website repo should:

- keep `free` pointing at normal signup
- change paid CTAs to point at an app-owned billing-intent route with semantic plan-selection fields such as `plan` and `billing_period`

This keeps billing intent explicit without requiring the website to know anything about checkout internals while still allowing the app to branch correctly for logged-in versus logged-out users.

### Billing-intent entry route

Add an app-owned route that receives paid-plan intent from the website, for example:

- `/billing/intent?plan=team&billing_period=monthly`

Suggested behavior:

- if the visitor is not authenticated, redirect to signup or login with `redirect_to` pointing back to the same billing-intent route
- if the visitor is authenticated and has a current company context with the `billing` feature enabled, redirect to `/:companyId/admin/billing` and preload the selected plan and interval
- if the visitor is authenticated but does not yet have a company, redirect to `/new?plan=...&billing_period=...`
- if the relevant company does not have the `billing` feature enabled, ignore the billing intent and fall back to the existing non-billing destination

This route centralizes the auth-aware decision instead of forcing the website to guess user state.

### App auth changes

Update signup and login plumbing so `redirect_to` is preserved consistently:

- the billing-intent route should be a valid `redirect_to` target throughout auth flows
- `SignUpWithEmail` button should preserve `redirect_to` in addition to `invite_token`
- Google signup/login should preserve `redirect_to`
- `SignUpWithEmailPage` should honor `redirect_to` after account creation when the user does not already land in a company via invite
- login already respects `redirect_to`; keep that behavior as the shared continuation path

### New company flow

Update `NewCompanyPage` so it reads:

- `plan`
- `billing_period`

from the URL query.

After a company is created:

- if no billing params are present, continue to company home as today
- if `plan=free`, continue to company home
- if the `billing` feature flag is disabled, ignore billing params and continue to company home as today
- if `plan` is paid, initialize the company billing record on `free` and store the selected plan and interval as `suggested_*` fields
- do not start checkout automatically
- surface the remembered plan later in the billing page and free-limit prompts
- if the owner later starts checkout and abandons it, keep the company on its last confirmed plan and allow retry from the billing page

This keeps company creation as the point where a company-level upgrade recommendation is first attached to a real company ID, without creating payment friction during signup.

## Billing UI

### Company Admin navigation

Add a new owner-only item under Company Admin:

- `Billing`

Suggested path:

- `/:companyId/admin/billing`

The navigation item and page should be hidden entirely unless `Companies.hasFeature(company, "billing")` is true.

Update:

- `app/assets/js/routes/index.tsx`
- `app/assets/js/routes/paths.tsx`
- `app/assets/js/pages/CompanyAdminPage/page.tsx`

### Billing page

Add a new page module:

- `CompanyBillingPage`

Suggested contents:

- current plan
- billing status
- remembered suggested plan, if any
- member limit
- current active member count
- next renewal / current period end
- cancel-at-period-end state
- upgrade actions for `free`
- plan-switch actions for existing paid plans
- cancel action
- reactivate action when cancellation is pending
- update credit card action
- fallback `Manage billing` action for provider-managed flows if needed
- success/pending banner after checkout return

The billing home should be organized as a few clear sections:

- `Current plan`
  - current tier
  - monthly or yearly interval
  - renewal date
  - status badge
- `Usage and limits`
  - active members
  - plan limit
  - free-plan limit warning when relevant
- `Payment method`
  - optional live masked-card summary when available from Polar
  - `Update credit card`
- `Billing actions`
  - `Change plan`
  - `Cancel plan`
  - `Keep plan` when cancellation is pending
- `Billing history`
  - invoices and receipts loaded from Polar on demand, or a clear action that opens them in Polar when we choose not to mirror them in-app

The page should also support direct arrival from the website billing-intent route by:

- preloading the requested `plan` and `billing_period`
- opening the plan-selection UI in that preselected state when appropriate
- requiring an explicit owner confirmation before creating any checkout session

The page should remain readable even when webhook sync is still catching up by:

- showing the last known local status
- allowing an owner-triggered `billing/refresh`
- polling briefly after a `checkout=success` return state

If a live Polar enrichment fails, the page should still render from the local projection and keep the main actions available.

The page should also support incomplete checkout recovery by:

- showing the pending target plan and billing interval when a checkout was started but not completed
- detecting expired or failed checkout attempts
- offering a `Complete upgrade` action that creates a fresh checkout session

The page should be the primary user-facing control surface for subscription management. Users should not need to leave the app to discover how to upgrade, cancel, or update payment method, even if some actions ultimately redirect into secure Polar-hosted flows for completion.

### Plan-selection flow

Add an explicit in-app plan-selection step before redirecting to Polar checkout.

Suggested UX:

- open from `Upgrade` or `Change plan`
- also support opening immediately from the website billing-intent route for logged-in owners
- present only the relevant plans for Operately Cloud:
  - `Team`
  - `Business`
- include a monthly/yearly segmented control
- show the current plan as a non-primary state
- show the remembered suggested plan as the default highlighted option when the company is still on `free`
- if `plan` and `billing_period` were provided by the billing-intent route, use those as the initial preselected values
- show concise limit-oriented copy for each plan
- include a small pre-checkout summary:
  - selected plan
  - billing interval
  - when the change takes effect
  - that card entry and payment confirmation happen in Polar
- CTA: `Continue to checkout`

This flow should not ask for payment details directly. Its purpose is only to let the owner make the plan decision inside Operately before the Polar handoff.

### Cancellation-confirmation flow

Add an explicit in-app cancellation confirmation flow.

Suggested UX:

- open from `Cancel plan`
- show:
  - access end date
  - free-plan limits after downgrade
  - current member count vs future free-plan limit
  - plain-language consequences of downgrade
- allow optional feedback
- provide a clear primary destructive action:
  - `Cancel plan`
- provide a non-destructive exit:
  - `Keep current plan`

This flow should optimize for clarity, not friction. Owners should understand the consequences before canceling, but should not have to fight the UI.

### Site-admin billing catalog page

Add a site-admin-only billing catalog screen for Operately operators.

Suggested contents:

- all synchronized Polar products
- active versus archived state
- plan family and billing interval mapping
- current price and currency
- product version
- `Sync from Polar` action
- `Set active product` action per `plan_family + billing_interval`

This screen is the operator-facing control plane for future product additions and product-version cutovers.

## Webhook Processing

### Flow

1. `POST /webhooks/polar` receives a webhook.
2. Verify signature against the raw request body.
3. Insert a `billing_webhook_events` row if the event ID has not been seen before.
4. Enqueue an Oban job to process the event.
5. Job fetches the latest customer state from Polar.
6. Resolve the company by external customer ID.
7. Upsert the company billing row with normalized state.
8. Mark the webhook event as processed.

### Relevant events

Initial implementation should handle the smallest useful event surface and normalize from there.

The intended trigger is:

- Polar customer-state change webhook

If additional webhook types are required by Polar during implementation, they should still funnel into the same `CustomerStateSync` path rather than creating separate local state machines.

### Idempotency and failure handling

- Duplicate webhook deliveries should be ignored safely.
- Failed processing should remain visible in `billing_webhook_events`.
- Retrying a failed job should be safe because state is rebuilt from Polar’s current customer state.

## Limit Enforcement

Hard limit enforcement should be the final rollout step and should remain behind the `billing` feature flag until launch.

This phase should begin only after the billing catalog, remembered-plan flow, billing UI, checkout handoffs, payment-method handoffs, and webhook synchronization are already complete and verified.

The implementation should use plan entitlements as the source of truth so all limits are enforced through one consistent mechanism rather than scattered hardcoded checks.

Suggested module:

- `Operately.Billing.EnforceLimits`

Responsibilities:

- read current company entitlements from `Operately.Billing.Plans`
- evaluate requested actions against plan limits
- return stable domain errors that UI and API layers can map to user-facing billing messages
- support member-count limits, storage limits, and future plan-governed limits from the same framework

### Member-count enforcement

Use active non-suspended people as the source of truth for company member count.

Suggested enforcement points:

- `Operately.Operations.CompanyMemberAdding`
- `Operately.Operations.CompanyJoiningViaInviteLink` for company-wide invites that create a person at accept time
- `Operately.Operations.GuestInviting` if guests count toward plan limits
- `Operately.Operations.CompanyMemberRestoring`

Member-limit rules:

- `free`: reject when active member count would exceed `20`
- `team`: reject when active member count would exceed `50`
- `business`: reject when active member count would exceed `200`

Member-count enforcement should not ship earlier as a standalone blocker. It should land together with the rest of the final entitlement-enforcement work.

### Storage-limit enforcement

Storage-limit enforcement is also in scope, but it should ship in the same final enforcement step as member-count limits.

Suggested source of truth:

- company-owned blob usage or another canonical company-level storage accounting source chosen during implementation

Suggested enforcement scope:

- uploads of company-owned files and attachments
- any other blob-creating flows that materially increase company storage usage

Storage-limit rules:

- `free`: reject or block uploads beyond `1 GB`
- `team`: reject or block uploads beyond `100 GB`
- `business`: reject or block uploads beyond `1 TB`

The exact accounting implementation may require a dedicated usage aggregator, but that accounting work should not delay the earlier billing and subscription-flow PRs.

As with member-count enforcement, storage blocking should not appear until the final enforcement phase is intentionally turned on.

### Future limits

Any future plan-governed limit should plug into the same entitlement enforcement framework and should follow the same rollout rule:

- flows first
- enforcement last

## Test Plan

### Backend tests

- plan catalog tests for limits and Polar product lookup
- remembered-plan tests for:
  - company creation from website-selected paid intent stores `suggested_plan_key` and `suggested_billing_interval`
  - no entitlements change occurs from remembered plan alone
- feature-flag tests for:
  - company-facing billing UI and behavior remain hidden when `billing` is not enabled
  - billing query params during signup/company creation become no-ops when the feature is disabled
  - limit enforcement remains disabled when the feature is off
- product-catalog tests for:
  - Polar product synchronization
  - active-product resolution by `plan_family + billing_interval`
  - archived/legacy product visibility
- checkout-session tests for:
  - owner access
  - non-owner rejection
  - invalid plan / interval rejection
  - free-plan rejection
- plan-preview tests for:
  - current plan badge and recommended plan state
  - monthly/yearly selection handling
  - in-app pre-checkout summary generation
- subscription-management tests for:
  - plan change
  - cancellation
  - reactivation
  - payment-method session creation
- cancellation-preview tests for:
  - access-end date copy
  - free-plan consequence warnings
  - over-limit-after-downgrade warnings
- webhook signature verification tests
- webhook idempotency tests
- customer-state sync tests for:
  - active subscription
  - canceled at period end
  - past due
  - fallback to free when no paid subscription is active
- billing refresh tests
- live enrichment fallback tests for:
  - rendering from the local projection when Polar detail fetches fail
  - continuing to expose core billing actions even when optional provider-native details are unavailable
- pending-checkout recovery tests
- limit-enforcement tests across all guarded operations, including:
  - member-count limits
  - storage limits
  - feature-flag-disabled no-op behavior until launch

### API/controller tests

- `POST /webhooks/polar` accepts valid signed payloads
- invalid signatures are rejected
- duplicate events do not enqueue duplicate work
- internal billing endpoints require authenticated owner access

### Frontend tests

- signup buttons preserve `redirect_to`
- paid website CTAs land on the billing-intent route, not directly on signup
- billing-intent route redirects unauthenticated users into auth and back again
- billing-intent route redirects authenticated users with a company directly to Billing with preselected plan state
- billing-intent route redirects authenticated users without a company to `NewCompanyPage`
- `NewCompanyPage` stores remembered upgrade preference when paid billing params are present
- `NewCompanyPage` ignores billing params when the `billing` feature is disabled
- billing page renders free, active, canceled, and pending states
- billing page handles `checkout=success` and invokes refresh/polling path
- billing page highlights remembered suggested plan when present
- billing page preselects website-requested plan and interval when opened from the billing-intent route
- billing page still renders from local state when optional Polar detail fetches fail
- billing page exposes cancel, reactivate, and update-credit-card actions
- plan-selection flow renders Team/Business cards and monthly/yearly toggle
- plan-selection flow hands off to Polar only after explicit confirmation
- cancellation-confirmation flow shows downgrade consequences before submit
- billing page offers restart for expired or failed checkout attempts
- Company Admin navigation hides Billing when the `billing` feature is disabled
- site-admin billing catalog page renders synchronized products and active mappings
- non-flagged companies render the existing Company Admin experience with no billing entry points

### Feature tests

- paid website intent -> signup -> company creation -> free company with remembered suggested plan
- paid website intent -> logged-in owner -> billing page with preselected plan and no immediate checkout
- existing owner upgrades from Company Admin billing page
- owner resumes an abandoned upgrade from the billing page
- user at free limit sees upgrade guidance when trying to add another member
- user at free storage limit sees upgrade guidance when trying to upload another file
- non-flagged company experiences no visible billing UI or new blocking behavior

## Implementation Plan

Implementation should land in vertical slices that keep the app usable throughout.

### PR 1: Billing foundation

- Add `company_billing_accounts`
- Add `billing_products`
- Add `billing_webhook_events`
- Add `Operately.Billing.Plans`
- Add `Operately.Billing.ProductCatalog`
- Add `billing` feature-flag scaffolding using the existing experimental-feature pattern
- Add `Operately.Billing` context and schemas
- Add runtime config placeholders and environment documentation

Outcome:

- the app can persist company billing state, remembered suggested plans, synchronized provider products, plan-family-to-product mappings, and safely keep all new behavior hidden behind a feature flag

### PR 2: Polar catalog sync and site-admin catalog controls

- Add `Operately.Billing.Polar.ProductSync`
- Add site-admin billing catalog API endpoints:
  - `billing/catalog/list`
  - `billing/catalog/sync`
  - `billing/catalog/set_active`
- Add site-admin billing catalog page
- Add product-version visibility and active-product selection

Outcome:

- Operately operators can create products in Polar, sync them into the app, and choose which product version is active for checkout

### PR 3: Website-intent routing, auth plumbing, and company-creation remembered-plan plumbing

- Update website paid CTAs to hit the app billing-intent route
- Add the app-owned billing-intent route and auth-aware branching logic
- Update app auth buttons to preserve `redirect_to`
- Update email signup completion to honor `redirect_to`
- Update `NewCompanyPage` to read `plan` and `billing_period`
- Persist paid-plan website selection into `suggested_plan_key` and `suggested_billing_interval` when the company is created
- Do not launch checkout automatically after company creation

Outcome:

- paid website intent reaches the correct in-app destination for both authenticated and unauthenticated users, and company creation still stores remembered upgrade preference without immediate checkout

### PR 4: Polar client and owner-scoped billing API

- Add `Operately.Billing.Polar.Client` using `Req`
- Add plan-preview flow helpers
- Add checkout-session creation
- Add cancellation-preview flow helpers
- Add change-plan actions
- Add cancel and reactivate actions
- Add payment-method session creation
- Add customer-portal fallback session creation
- Add internal billing API endpoints:
  - `billing/get`
  - `billing/preview_plan_change`
  - `billing/create_checkout_session`
  - `billing/change_plan`
  - `billing/preview_cancellation`
  - `billing/cancel`
  - `billing/reactivate`
  - `billing/create_payment_method_session`
  - `billing/create_customer_portal_session`
  - `billing/refresh`
- Add owner authorization checks

Outcome:

- an authenticated owner can start checkout, change plans, cancel, reactivate, update payment method, and inspect billing state

### PR 5: Company Admin billing page

- Add `/:companyId/admin/billing`
- Add Company Admin navigation entry
- Add `CompanyBillingPage`
- Render free and paid states from `billing/get`
- Render remembered suggested plan and interval when present
- Add in-app plan-selection flow with Team/Business cards and monthly/yearly toggle
- Support direct website-entry preselection of target plan and billing interval for logged-in owners
- Add upgrade buttons, change-plan actions, cancel, reactivate, and update-credit-card actions
- Add in-app cancellation-confirmation flow with downgrade consequences
- Add fallback `Manage billing` entry when provider-hosted management is needed
- Add post-checkout success handling via `checkout=success`
- Add pending-checkout, expired-checkout, and failed-checkout recovery UI
- Keep all company-facing billing navigation and actions hidden unless the `billing` feature is enabled

Outcome:

- owners can manage billing entirely from Company Admin without being forced to upgrade during signup

### PR 6: Webhook endpoint and async sync

- Add `POST /webhooks/polar`
- Add raw-body signature verification
- Add webhook event persistence and idempotency
- Add Oban worker for processing billing webhooks
- Add customer-state synchronization from Polar into `company_billing_accounts`

Outcome:

- local company billing state stays synchronized with Polar

### PR 7: Verification and rollout hardening

- Add feature coverage for remembered-plan signup flow and billing-page upgrades
- Add observability around webhook failures and sync health
- Document operator setup for Polar secrets and billing-catalog sync procedures
- Document product-version cutover and subscription-migration procedures
- Verify production-safe behavior for delayed webhooks and manual refresh
- Verify that non-flagged companies still see the pre-billing UX with no new navigation or blockers

Outcome:

- the billing flow is launch-ready and operable in production while still hidden behind the feature flag

### PR 8: Final limit enforcement

- Add reusable `Operately.Billing.EnforceLimits`
- Integrate member-count enforcement into company member creation and restore paths
- Integrate storage-limit enforcement into company-owned upload flows
- Ensure future limit keys can reuse the same entitlement-based enforcement path
- Show upgrade guidance that defaults to the remembered suggested plan when a blocked action hits a plan limit
- Keep all enforcement behind the `billing` feature flag until launch
- Map domain errors to stable UI/API messages

Outcome:

- all hard plan limits are enforced, but only after the billing and subscription flows are complete

### PR 9: Launch enablement

- Remove or globally retire the `billing` feature flag checks in a dedicated launch PR
- Expose Billing navigation and flows to normal companies
- Turn on limit enforcement for launched companies
- Verify there is no user-visible behavior change left gated unexpectedly

Outcome:

- the billing system becomes visible to users only after all rollout work is complete

## Assumptions and Defaults

- Existing companies default to `free` unless a billing row says otherwise.
- There is no migration of legacy paid subscriptions because the app does not currently bill customers.
- Company owners, not company admins broadly, are the write authority for billing.
- Member limits count active company people and exclude suspended people.
- Storage limits are enforced at the company level using a canonical company-owned usage source selected during implementation.
- Companies created during a paid website-plan selection remain usable on `free` until Polar confirms an active paid subscription.
- Website-selected paid plans are stored only as remembered upgrade preferences until the owner explicitly starts checkout from the app.
- Checkout URLs are treated as disposable; abandoned or expired checkout attempts should be resumed by creating a fresh checkout session.
- Polar product creation and price editing happen in Polar first; Operately consumes those products through a synchronized local catalog and operator-selected active mappings.
- Product price changes for existing subscribers require explicit subscription migration and should not be assumed to happen automatically as part of catalog edits.
- The billing page is the primary management surface. Provider-hosted flows may still be used for secure payment-method capture or unsupported edge cases, but those flows must be launched from explicit actions in the app.
- Upgrades and paid interval changes should use an Operately-owned plan-selection step before redirecting to Polar checkout.
- Cancellation should use an Operately-owned confirmation step before the backend submits the change to Polar.
- Checkout return should be treated as advisory only; Polar webhooks remain the source of truth for paid status.
- Until the launch PR removes or retires the gate, non-flagged companies must see no billing UI changes and no new limit-enforcement behavior.
- Member-count, storage, and future entitlement enforcement ship only after the billing and subscription flows are already in place.
- Self-hosted installations remain outside this billing flow.
