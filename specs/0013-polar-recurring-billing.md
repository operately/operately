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
- if the visitor is authenticated and has no company yet, that route redirects to `/new?plan=team&billing_period=monthly`
- if the visitor is authenticated and can manage billing for exactly one company, that route redirects directly to that company's billing page with the selected plan and interval preloaded
- if the visitor is authenticated and can manage billing for more than one company, that route redirects to a company-picker screen that carries the selected plan and interval forward

`redirect_to` is still the correct mechanism for the unauthenticated continuation path, but it should no longer be the website's only entrypoint.

The company-picker screen should show only companies where the user can manage billing, and once a company is chosen it should redirect to that company's billing page with the original `plan` and `billing_period` preserved.

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

Owners and company admins should still be able to see upgrade-oriented limit warnings and approaching-limit banners. Those prompts may invite an upgrade, but any action that actually starts checkout or mutates billing must still require owner authorization.

### 11. Operately owns decision flows; Polar owns secure payment flows

The app should not dump users into a generic provider portal as the primary experience.

Instead:

- Operately owns the billing overview, plan selection, downgrade confirmation, and cancellation confirmation flows
- Operately redirects to Polar only when secure provider-hosted payment steps are needed, such as:
  - entering or confirming card details
  - confirming a paid subscription through checkout
  - updating a payment method through a hosted card-management flow
- a generic provider-managed portal may still exist as an operational fallback, but it is not the primary UX

This does not require an extra explanatory screen before every provider redirect. In particular, payment-method updates may launch directly from the Billing page into a Polar-hosted card-management flow.

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

### 14. Approaching-limit warnings should appear before blocking

Before a company actually hits a member or storage limit, owners and company admins should see a non-blocking upgrade invitation once usage reaches `90%` of the current plan limit.

Requirements:

- the warning should be rendered as a dismissible banner in company pages rather than only as Billing-page copy
- the copy should feel like an invitation to upgrade before work is blocked, similar in tone to consumer storage-quota warnings
- the banner should allow an `X` dismiss action
- the dismissal state may live in local storage, keyed by company and warning type
- a dismissed banner should reappear after a cooldown period so the reminder is temporary, not permanent
- no user action is blocked at this stage

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

- products can be created directly from the Operately site-admin billing catalog page, and that create flow should create the product in Polar first and then persist the corresponding local catalog row with the returned provider ID
- products can be updated and archived directly from the Operately site-admin billing catalog page
- a `Sync from Polar` action is also available to pull existing Polar products into `billing_products`; this is useful for initial setup, importing products that were created manually in Polar, or reconciling out-of-band provider changes
- Operately operators choose which product is the active product for a given `plan_family + billing_interval`
- checkout resolution uses the active local catalog entry, not a hardcoded ID

The normal operator workflow should be to add future products or product versions from the Operately admin panel. `Sync from Polar` remains available for import and reconciliation when needed.

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

### 3. Logged-in owner with one company clicks a paid CTA on the website

1. User clicks a paid CTA on the website while already logged in to Operately.
2. The billing-intent route determines that the user can manage billing for exactly one company.
3. The app auto-selects that company and redirects directly to `/:companyId/admin/billing` with the selected `plan` and `billing_period`.
4. The billing page opens with that plan and billing interval preselected in the in-app plan-selection flow.
5. No checkout session is created yet.
6. The owner can confirm the selection, change it, or leave without any billing mutation.

### 4. Logged-in owner with multiple companies clicks a paid CTA on the website

1. User clicks a paid CTA on the website while already logged in to Operately.
2. The billing-intent route determines that the user can manage billing for more than one company.
3. The app redirects to a company-picker page instead of guessing which company should be billed.
4. The company-picker page lists only companies where the user can manage billing and keeps the selected `plan` and `billing_period` visible.
5. The user chooses a company.
6. The app redirects to the chosen company's billing page with the same selected `plan` and `billing_period`.
7. The billing page opens with that plan and billing interval preselected in the in-app plan-selection flow.
8. No checkout session is created yet.

### 5. Owner upgrades from inside the app

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
6. Owner chooses the target plan and clicks `Continue to checkout`.
7. App creates a Polar checkout session for the selected target plan for the existing company.
8. User is redirected to Polar checkout.
9. After return and webhook sync, the billing page reflects the new paid state.

### 6. Owner manages an active subscription from the billing page

1. Owner opens `Company Admin -> Billing`.
2. The page exposes explicit actions for:
   - upgrading or changing plan
   - canceling the subscription
   - reactivating a pending cancellation
   - updating the payment method
   - reviewing billing status and renewal timing
3. Upgrade/change-plan actions begin from Operately-owned surfaces:
   - `free` and `canceled` companies open the dedicated plan-selection page and continue into checkout
   - already-paid companies reuse the same plan-selection page, but the submit action calls `billing/change_plan` instead of starting checkout
4. Cancellation actions remain explicit Operately-owned flows before any provider redirect or API mutation occurs.
5. Where Polar supports direct API-driven changes, Operately executes them from named in-app actions.
6. Where Polar requires a hosted payment-management flow, the billing-page action launches that secure provider-managed flow and returns the user to the billing page.
7. Polar webhooks synchronize resulting state changes back into Operately.

### 7. Owner manages payment method

1. Owner clicks `Update credit card` or equivalent from the billing page.
2. Backend creates the appropriate secure Polar-hosted payment-method management session.
3. User completes the update flow.
4. App returns the user to the billing page and refreshes billing state.

### 8. Upgrade is attempted later and checkout is abandoned or fails

1. Company is already active on `free` or on an existing paid plan.
2. Owner explicitly starts an upgrade or plan-change checkout from the billing page.
3. The user does not complete payment, or the checkout expires or fails.
4. The company remains on its last confirmed plan.
5. Operately records the pending target plan and the most recent checkout attempt details.
6. The owner can later return to the billing page and click `Complete upgrade` or `Retry checkout`.
7. Operately creates a fresh checkout session and redirects the owner back to Polar.

If the company had not yet upgraded successfully, it remains on `free`.

### 9. Company hits member limit

1. An operation tries to add, restore, invite, or create an active company member beyond the plan limit.
2. Backend rejects the operation with a billing-limit error.
3. For blocked in-app actions such as member adds, restores, or invite creation, UI surfaces an in-context limit-warning step that explains current usage versus the plan limit.
4. If the acting user is an owner or company admin, the warning should invite an upgrade and recommend the appropriate upgrade path for that user's permissions.
5. If the acting user is a regular member, the warning should state that the company has reached its member limit and that they should contact a company owner or admin.
6. If the company has a remembered website-selected plan, that plan should be the default recommendation in the upgrade prompt and preselected plan-selection flow.
7. If the blocked actor is an owner and they continue, the app may open the in-app plan-selection flow directly instead of stopping first on the billing overview page.
8. If someone tries to join the company from an invite while the company is already at its member limit, the join must not proceed. Instead, redirect that person to a dedicated page explaining that the company has reached its user limit and that an owner or admin must upgrade the plan before they can join.

### 10. Company hits storage limit during upload

1. An upload or attachment creation would push company-owned storage beyond the plan limit.
2. Backend rejects the operation with a billing-limit error before the new bytes are accepted.
3. UI explains the current storage usage versus the plan limit.
4. If the acting user is an owner or company admin, the warning should invite an upgrade and recommend the appropriate upgrade path for that user's permissions.
5. If the acting user is a regular member, the warning should state that the company has reached its storage limit and that they should contact a company owner or admin.

### 11. Company approaches a member or storage limit

1. The company reaches `90%` of either its member limit or storage limit.
2. Owners and company admins should see a non-blocking banner somewhere in the company UI, not only on the Billing page.
3. The banner should read like an invitation to upgrade before work is blocked.
4. The banner should be dismissible with an `X`.
5. The dismissed state should be stored in local storage, scoped by company and warning type, and the banner should reappear after a cooldown period.
6. If the company has a remembered website-selected plan, that plan should be the default recommendation for the banner CTA.
7. No membership or upload action is blocked yet at this stage.

### 12. Owner cancels a subscription

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

### 13. Owner reactivates a subscription scheduled for cancellation

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
- `billing/change_plan`
- `billing/cancel`
- `billing/reactivate`
- `billing/create_payment_method_session`
- `billing/create_customer_portal_session`
- `billing/refresh`
- `billing/catalog/list`
- `billing/catalog/sync`
- `billing/catalog/set_active`

Expected behavior:

- `get`: returns normalized company billing state plus plan metadata, active catalog products, remembered recommendation data, and current member count so the frontend can derive plan-selection and cancellation-confirmation previews locally
- `create_checkout_session`: validates ownership, resolves the active local catalog entry for the selected plan and interval, and creates a Polar-hosted checkout for plan transitions that require secure payment confirmation
- `change_plan`: applies or schedules plan changes that do not require a new checkout, such as downgrade-at-period-end flows when supported by the provider integration
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
- `OPERATELY_BILLING_ENABLED` — instance-level gate that defaults to `false`. When `false`, the entire billing subsystem is disabled regardless of company feature flags. This keeps self-hosted installations unaffected until billing is explicitly turned on.

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
- if the visitor is authenticated and has no company yet, redirect to `/new?plan=...&billing_period=...`
- if the visitor is authenticated and can manage billing for exactly one company with the `billing` feature enabled, redirect to `/:companyId/admin/billing` and preload the selected plan and interval
- if the visitor is authenticated and can manage billing for more than one company with the `billing` feature enabled, redirect to a company-picker route and preserve the selected plan and interval there
- if the relevant company does not have the `billing` feature enabled, ignore the billing intent and fall back to the existing non-billing destination

This route centralizes the auth-aware decision instead of forcing the website to guess user state.

The company-picker route should be a lightweight app-owned page that:

- lists only companies where the current user can manage billing
- keeps the selected `plan` and `billing_period` visible
- redirects to the chosen company's billing page with the same preselected plan state

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
- approaching-limit banner state, when the company is near member or storage limits
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
  - storage usage and storage limit, once canonical company-level storage accounting is exposed to the billing UI
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
- listening for a company-scoped `billing_updated` subscription and refreshing when the backend reports a billing-state change
- treating `checkout_id={CHECKOUT_ID}` as a return hint rather than a source of truth
- showing the normal billing surface while waiting for webhook-driven confirmation when the paid state is not reflected yet

The subscription-driven refresh path should be the only automatic confirmation path after checkout return. The billing page should not poll Polar directly after `checkout_id={CHECKOUT_ID}`.

If a live Polar enrichment fails, the page should still render from the local projection and keep the main actions available.

Until storage accounting is wired through cleanly, the billing overview may temporarily show only member-based limits. A later rollout step must extend the same `Usage and limits` section to show storage usage and the storage allowance for the current plan.

The page should also support incomplete checkout recovery by:

- showing the pending target plan and billing interval when a checkout was started but not completed
- detecting expired or failed checkout attempts
- offering a `Complete upgrade` action that creates a fresh checkout session

The page should be the primary user-facing control surface for subscription management. Users should not need to leave the app to discover how to upgrade, cancel, or update payment method, even if some actions ultimately redirect into secure Polar-hosted flows for completion.

### Approaching-limit banner

Add a shared company-scoped warning banner for near-limit states.

Suggested behavior:

- show it to owners and company admins when member usage or storage usage reaches at least `90%` of the current plan limit
- do not show it to regular members
- use inviting copy that encourages an early upgrade before work is blocked
- include a clear CTA appropriate to the viewer's permissions:
  - owners can go directly to the Billing page or plan-selection flow
  - company admins can be shown owner-contact guidance if checkout remains owner-only
- if the company has a remembered suggested plan, use that as the default recommendation
- allow dismissal with an `X`
- persist dismissal in local storage with a cooldown so the banner reappears later
- keep the banner behind the `billing` feature flag until launch

### Plan-selection flow

Add an explicit in-app plan-selection step before redirecting to Polar checkout.

Suggested UX:

- open from `Upgrade` or `Change plan`
- also support opening immediately from the website billing-intent route for logged-in owners
- also support opening directly from an over-limit upgrade prompt without first landing on the billing overview page
- present only the relevant plans for Operately Cloud:
  - `Team`
  - `Business`
- include a monthly/yearly segmented control
- reuse this same separate plan-selection page for already-paid companies; in that case the primary action should be `Change plan` and should call `billing/change_plan` rather than creating a checkout session
- show the current plan as a non-primary state
- show the remembered suggested plan as the default highlighted option when the company is still on `free`
- if `plan` and `billing_period` were provided by the billing-intent route, use those as the initial preselected values
- if the flow was opened from a limit-warning prompt, preselect the recommended upgrade immediately
- show concise limit-oriented copy for each plan
  - include storage allowance alongside member allowance once storage accounting and storage-copy support are ready
- CTA: `Continue to checkout`

This flow should not ask for payment details directly. Its purpose is only to let the owner make the plan decision inside Operately before the Polar handoff.

If the first shipped version of this flow only shows member-based comparisons, that should be treated as temporary. A later rollout step must update the same plan-selection UI to also show the storage included in each plan.

### Cancellation-confirmation flow

Add an explicit in-app cancellation confirmation flow.

Suggested UX:

- open from `Cancel plan`
- show:
  - access end date
  - free-plan limits after downgrade
  - current member count vs future free-plan limit
  - plain-language consequences of downgrade
- optional feedback remains out of scope for this step
- provide a clear primary destructive action:
  - `Cancel plan`
- provide a non-destructive exit:
  - `Keep current plan`

Reactivation should remain a direct action on the billing overview page rather than opening a separate confirmation step.

This flow should optimize for clarity, not friction. Owners should understand the consequences before canceling, but should not have to fight the UI.

The confirmation copy and warnings in this flow should be derived from `billing/get`, current plan entitlements, and the current member count, not from a dedicated backend preview endpoint.

### Site-admin billing catalog page

Add a site-admin-only billing catalog screen for Operately operators. This page is only visible when `OPERATELY_BILLING_ENABLED` is `true`.

Suggested contents:

- all local billing products (whether created in Operately or synced from Polar)
- active versus archived state
- plan family and billing interval mapping
- current price and currency
- product version
- `Create product` action — creates a new product in Polar from the admin panel and then stores or synchronizes the corresponding local catalog entry
- `Edit product` action — updates product details
- `Archive product` action — marks a product as archived
- `Sync from Polar` action — pulls products from Polar into the local catalog; displays a message explaining that this is for importing pre-existing Polar products or reconciling out-of-band provider changes
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
8. Broadcast a company-scoped `billing_updated` event so open billing pages can refetch.
9. Mark the webhook event as processed.

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
- expose near-limit warning state when usage reaches `90%` of a plan threshold
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
- when an in-app add, restore, or invite action is blocked, owners and company admins should see upgrade-oriented messaging while regular members should be told to contact a company owner or admin
- when invite-link acceptance is blocked, redirect the joining person to a dedicated member-limit page instead of allowing a partial join

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
- when an upload is blocked, owners and company admins should see upgrade-oriented messaging while regular members should be told to contact a company owner or admin
- rejected uploads should not leave behind partial blob usage or partially-created attachment records

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
- subscription-management tests for:
  - plan change
  - cancellation
  - reactivation
  - payment-method session creation
- billing-page state-derivation tests for:
  - current plan badge and recommended plan state
  - monthly/yearly selection handling
  - in-app plan-selection state derived from `billing/get`
  - cancellation consequences and over-limit warnings derived from current billing state
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
  - invite-link acceptance blocked at member limit
  - role-aware messaging payloads for privileged versus regular users
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
- billing-intent route redirects authenticated users with exactly one billable company directly to Billing with preselected plan state
- billing-intent route redirects authenticated users with multiple billable companies to a company-picker page
- company-picker page preserves the selected plan and billing interval when continuing to Billing
- billing-intent route redirects authenticated users without a company to `NewCompanyPage`
- `NewCompanyPage` stores remembered upgrade preference when paid billing params are present
- `NewCompanyPage` ignores billing params when the `billing` feature is disabled
- billing page renders free, active, canceled, and pending states
- billing page handles `checkout_id={CHECKOUT_ID}` and waits for webhook-driven subscription refresh when confirmation is still pending
- billing page highlights remembered suggested plan when present
- billing page preselects website-requested plan and interval when opened from the billing-intent route
- billing page still renders from local state when optional Polar detail fetches fail
- billing page exposes cancel, reactivate, and update-credit-card actions
- plan-selection flow renders Team/Business cards and monthly/yearly toggle
- plan-selection flow hands off to Polar only after explicit confirmation
- cancellation-confirmation flow shows downgrade consequences before submit
- billing page offers restart for expired or failed checkout attempts
- blocked member/storage limit warnings render upgrade-oriented copy for owners/admins and contact-owner/admin copy for regular members
- approaching-limit banner appears for owners/admins at `90%` usage and can be dismissed temporarily
- approaching-limit banner dismissal is restored from local storage and reappears after the cooldown
- regular members do not see the approaching-limit upgrade banner
- invite-limit landing page renders the correct contact-owner/admin message
- Company Admin navigation hides Billing when the `billing` feature is disabled
- site-admin billing catalog page renders synchronized products and active mappings
- non-flagged companies render the existing Company Admin experience with no billing entry points

### Feature tests

- paid website intent -> signup -> company creation -> free company with remembered suggested plan
- paid website intent -> logged-in owner -> billing page with preselected plan and no immediate checkout
- existing owner upgrades from Company Admin billing page
- owner resumes an abandoned upgrade from the billing page
- owner or company admin at free member limit sees upgrade guidance when trying to add another member or create an invite
- joining from an invite is blocked with a member-limit page when the company is already full
- owner or company admin at free storage limit sees upgrade guidance when trying to upload another file
- regular member at free storage limit is told to contact a company owner or admin
- owner or company admin at `90%` member/storage usage sees a dismissible upgrade banner before any hard block
- non-flagged company experiences no visible billing UI or new blocking behavior

## Implementation Plan

Implementation should land in vertical slices that keep the app usable throughout.

### PR 1: Billing foundation (COMPLETED ✅)

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

### PR 2: Polar catalog sync and site-admin catalog controls (COMPLETED ✅)

- Add `Operately.Billing.Polar.ProductSync`
- Add site-admin billing catalog API endpoints:
  - `billing/catalog/list`
  - `billing/catalog/sync`
  - `billing/catalog/set_active`
  - `billing/catalog/create`
  - `billing/catalog/update`
  - `billing/catalog/archive`
- Add site-admin billing catalog page
- Add product-version visibility and active-product selection
- Add product CRUD UI (create, edit, archive)
- Add explanatory message for the `Sync from Polar` action

Outcome:

- Operately operators have the billing catalog UI, local catalog controls, and active-product selection in place; the real Polar-backed create/sync wiring lands in PR 4a

### PR 3a: Auth `redirect_to` preservation (COMPLETED ✅)

- Update app auth buttons to preserve `redirect_to`
  - Google OAuth button forwards `redirect_to` into `/accounts/auth/google`
  - Email signup button preserves `redirect_to` when navigating to `/sign_up/email`
- Update email login to honor `redirect_to` after successful authentication
- Update email signup completion to honor `redirect_to` after account creation and auto-login
- Update Google OAuth callback to restore and use `redirect_to` from session
- Ensure `AccountAuth.log_in_account/3` prefers explicit `redirect_to` param over session fallbacks

Outcome:

- All auth entry points (email login, email signup, Google OAuth) correctly preserve and honor a `redirect_to` parameter, enabling any external or in-app flow to redirect users back to a specific post-auth destination

### PR 3b: Website-intent routing, billing-intent route, and company picker (COMPLETED ✅)

- Update website paid CTAs to hit the app billing-intent route
  - Team and Business plan links on the pricing page point to `/billing/intent?plan=team|business&billing_period=monthly|yearly`
- Add the app-owned `GET /billing/intent` route with auth-aware branching logic
  - Not authenticated → redirect to `/log_in?redirect_to=/billing/intent?plan=...&billing_period=...`
  - Authenticated, no companies → redirect to `/new?plan=...&billing_period=...`
  - Authenticated, exactly one company where user is owner → redirect to `/:companyId/admin/billing?plan=...&billing_period=...`
  - Authenticated, multiple owner companies → redirect to `/billing/pick-company?plan=...&billing_period=...`
- Add the company-picker page for authenticated users who can manage billing in multiple companies
  - Lists only companies where the current user is an owner
  - Preserves and displays the selected `plan` and `billing_period`
  - Redirects to `/:companyId/admin/billing?plan=...&billing_period=...` on selection

Outcome:

- Paid website intent reaches the correct in-app destination for unauthenticated users, authenticated users with one billable company, authenticated users with multiple billable companies, and authenticated users without a company

### PR 3c: Company-creation remembered-plan plumbing (COMPLETED ✅)

- Update `NewCompanyPage` to read `plan` and `billing_period` from the URL query string and include them in the create-company API call
- Update the create-company API mutation to accept optional `plan` and `billing_period` inputs
- Update `Operately.Operations.CompanyAdding` to accept billing-plan params
- After company creation, if a paid plan was passed and billing is enabled for the instance:
  - Create or fetch the company's billing account
  - Persist the selected plan and interval as `suggested_plan_key` and `suggested_billing_interval` with source `"website"`
- Ensure the company starts on `free` with no immediate checkout requirement
- Do not launch checkout automatically after company creation

Outcome:

- Company creation stores the remembered upgrade preference from the website without immediate checkout, and the company remains on the free plan until an explicit upgrade action is taken later

### PR 4a: Polar client foundation and read-only billing state (COMPLETED ✅)

- Add `Operately.Billing.Polar.Client` using `Req`
- Add Polar runtime configuration and shared request/error handling
- Wire the existing product-sync path to the real Polar client
- Wire site-admin catalog create actions to the real Polar client so creating a product in the admin panel creates it in Polar and then persists the resulting local catalog entry
- Add shared owner authorization and billing-feature gate checks for company-scoped billing actions
- Add internal billing API endpoints:
  - `billing/get`
  - `billing/refresh`
- Fetch normalized customer state from Polar by external customer ID and return it through `billing/get`

Outcome:

- the app can talk to Polar, create provider-backed catalog products from the admin panel, refresh company billing state on demand, and return a normalized owner-visible billing snapshot

### PR 4b: Provider-managed sessions (COMPLETED ✅)

- Add payment-method session creation
- Add customer-portal fallback session creation
- Add internal billing API endpoints:
  - `billing/create_payment_method_session`
  - `billing/create_customer_portal_session`

Outcome:

- an authenticated owner can load billing state through `billing/get` and launch secure Polar-hosted management flows when needed

### PR 4c: Checkout-session creation and pending-upgrade tracking (COMPLETED ✅)

- Add checkout-session creation
- Resolve the active local billing product for the requested `plan + billing_interval`
- Create Polar checkout sessions with company external ID and Operately return URLs
- Persist pending checkout state so abandoned or expired checkouts can be resumed later
- Add internal billing API endpoint:
  - `billing/create_checkout_session`

Outcome:

- an authenticated owner can explicitly start or retry a paid checkout from Operately without changing local entitlements before Polar confirms success

### PR 4d: Direct subscription mutation actions (COMPLETED ✅)

- Add change-plan actions
- Add cancel and reactivate actions
- Use the latest Polar customer/subscription state before sensitive mutations when required
- Add internal billing API endpoints:
  - `billing/change_plan`
  - `billing/cancel`
  - `billing/reactivate`

Outcome:

- an authenticated owner can change plans when checkout is not required, schedule cancellation, and reactivate a pending cancellation from the app

### PR 5a: Company Admin billing page foundation (COMPLETED ✅)

- Add `/:companyId/admin/billing`
- Add Company Admin navigation entry
- Add `CompanyBillingPage`
- Render free, paid, canceled, and pending states from `billing/get`
- Render remembered suggested plan and interval when present
- Keep all company-facing billing navigation and actions hidden unless the `billing` feature is enabled

Outcome:

- owners can load billing state and reach the billing surface from Company Admin

### PR 5b: Upgrade and checkout UX (COMPLETED ✅)

- Add in-app plan-selection flow with Team/Business cards and monthly/yearly toggle
- Support direct website-entry preselection of target plan and billing interval for logged-in owners
- Add upgrade buttons and `billing/create_checkout_session`
- Add post-checkout return handling via `checkout_id={CHECKOUT_ID}` using current billing state plus future subscription-driven refresh
- Add pending-checkout, expired-checkout, and failed-checkout recovery UI

Outcome:

- owners can start and recover checkout from Company Admin

### PR 5c: Active subscription management (COMPLETED ✅)

- Reuse the separate plan-selection page for already-paid companies and submit those changes through `billing/change_plan`
- Add update-credit-card action that opens a hosted Polar payment-method session and returns to the billing overview page
- Add fallback `Manage billing` action that opens a hosted Polar customer-portal session and returns to the billing overview page
- Keep cancel/reactivate UI out of this step; they land in PR 5d

Outcome:

- owners can manage active paid subscriptions from Company Admin without leaving Operately for the primary flows

### PR 5d: Cancellation and reactivation UX (COMPLETED ✅)

- Add a dedicated in-app cancellation-confirmation page with downgrade consequences
- Add `Cancel plan` from the overview page for live paid subscriptions
- Add direct `Reactivate plan` from the overview page when cancellation is already scheduled
- Keep optional cancellation feedback out of scope for this step

Outcome:

- owners can manage billing entirely from Company Admin without being forced to upgrade during signup

### PR 6a: Webhook ingress and signature verification (COMPLETED ✅)

- Add `POST /webhooks/polar`
- Add raw-body capture for signature verification
- Verify Polar webhook signatures before accepting events

Outcome:

- Polar can securely reach Operately, and invalid webhook requests are rejected at the edge

### PR 6b: Webhook event persistence and enqueue (COMPLETED ✅)

- Persist accepted webhook events in `billing_webhook_events`
- Add idempotency by provider event ID
- Enqueue an Oban job for async processing

Outcome:

- accepted webhook deliveries are stored safely, deduplicated, and handed off for background processing

### PR 6c: Async processing and billing sync (COMPLETED ✅)

- Add the Oban worker for processing billing webhooks
- Fetch fresh customer state from Polar during processing
- Synchronize `company_billing_accounts` from current provider state
- Mark persisted webhook events as processed or failed

Outcome:

- local company billing state stays synchronized with Polar through an idempotent async processing path

### PR 6d: Billing broadcasts and page refresh integration

- Broadcast `billing_updated` to subscribed company-owner clients after successful sync
- Update the billing page checkout-return behavior to rely on webhook-driven refresh rather than polling

Outcome:

- open billing pages are notified promptly after webhook-driven changes and can refresh without polling

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
- Integrate member-count enforcement into company member creation, invite creation, invite-join, and restore paths
- Integrate storage-limit enforcement into company-owned upload flows
- Update both the billing overview page and the plan-selection page to surface storage usage and plan storage allowances once storage accounting is available in the billing UI
- Ensure future limit keys can reuse the same entitlement-based enforcement path
- Show upgrade guidance that defaults to the remembered suggested plan when a blocked action hits a plan limit
- Add role-aware limit messaging for owners/admins versus regular members
- Block invite-based joins with a dedicated member-limit page when the company is already full
- Add non-blocking `90%`-usage upgrade banners for owners and company admins, with local-storage-based dismissal cooldown
- Keep all enforcement behind the `billing` feature flag until launch
- Map domain errors to stable UI/API messages

Outcome:

- all hard plan limits are enforced, and owners/company admins receive proactive upgrade nudges before limits block work

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
- Polar product creation should normally happen through the Operately admin panel, which creates the provider-side product and then records it in the synchronized local catalog. `Sync from Polar` remains available for importing or reconciling products created directly in Polar when needed.
- Product price changes for existing subscribers require explicit subscription migration and should not be assumed to happen automatically as part of catalog edits.
- The billing page is the primary management surface. Provider-hosted flows may still be used for secure payment-method capture or unsupported edge cases, but those flows must be launched from explicit actions in the app.
- Upgrades and paid interval changes should use an Operately-owned plan-selection step before redirecting to Polar checkout.
- Cancellation should use an Operately-owned confirmation step before the backend submits the change to Polar.
- Checkout return should be treated as advisory only; Polar webhooks remain the source of truth for paid status.
- Until the launch PR removes or retires the gate, non-flagged companies must see no billing UI changes and no new limit-enforcement behavior.
- Member-count, storage, and future entitlement enforcement ship only after the billing and subscription flows are already in place.
- Self-hosted installations remain outside this billing flow.
