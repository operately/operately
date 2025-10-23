## Overview

Update the assignments email so it mirrors the Review Page v2 experience when the experimental feature flag `review_v2` is enabled for a company. The work spans feature flag plumbing, loader selection, email templates, and feature coverage tests.

## Goals

- Honor the `review_v2` experimental feature flag in `Operately.Companies`.
- Reuse `Operately.Assignments.LoaderV2` for the assignments email when the flag is enabled.
- Introduce dedicated HTML + text templates that render grouped assignments exactly like Review Page v2.
- Extend feature tests to cover both V1 and V2 email behaviors with realistic data factories.

## Non-Goals

- No changes to the Review Page UI.
- No runtime feature flag management UI changes.
- No refactors outside the assignments email pipeline.

## Implementation Plan

### 1. Feature Flag Plumbing

1. Extend `app/lib/operately/companies.ex` with `has_experimental_feature?(company, feature_name)`:
   - Accept `%Operately.Companies.Company{}` or company ID.
   - Safely handle `nil` or missing experimental features list.
   - Use guard clauses to keep pattern matching tight.
2. Ensure the implementation matches existing feature flag storage (`features` JSONB column).
3. Add unit coverage if a convenient test location exists (otherwise rely on existing tests via integration).

### 2. Email Loader Selection

1. In `app/lib/operately_email/emails/assignments_email.ex`:
   - Inject the company into the assignments context (ensure already available).
   - Use `Operately.Companies.has_experimental_feature?(company, "review_v2")` to branch.
   - When `true`, call `Operately.Assignments.LoaderV2.load(company, opts)` (mirror the arguments used in the Review Page).
   - Fallback to existing loader for legacy behavior.
   - Keep assignments payload shape consistent with the template expectations; introduce a helper function if needed.
2. Ensure formatting changes stay minimal per guidelines.

### 3. New Templates

1. Create `app/lib/operately_email/templates/assignments_v2.html.eex` and `assignments_v2.text.eex`.
2. Structure the HTML to match `turboui/src/ReviewPageV2/index.tsx`:
   - Render sections grouped by assignment type (e.g., goals, projects, check-ins, tasks).
   - Reuse existing email styles/classes when possible for typography and spacing.
   - Display counts, due dates, and key metadata identical to the web view.
3. The text template should include headings and bullet lists that parallel the HTML content.
4. Update the email module to select the appropriate template based on the loader in use.

### 4. Shared Formatting Utilities (Optional)

- If date formatting diverges between V1 and V2 templates, introduce helper functions in the email module to keep templates clean.
- Ensure timezone handling matches current assignments email behavior.

### 5. Tests

1. Add a new `describe "assignments email v2"` block to `app/test/features/assignments_email_test.exs`.
2. Use factories to seed:
   - Companies with and without `review_v2`.
   - Assignments covering all resource types rendered by LoaderV2.
3. Use helper utilities (potentially `app/test/support/features/ui/assignments_steps.ex`) to normalize dates and compose payloads.
4. Assert that:
   - Loader selection respects the feature flag.
   - Each group renders with expected text/links in both HTML and text emails.
   - Legacy behavior remains unaffected when the flag is off.

## Rollout & Monitoring

- Verify `make test.mix.features` passes locally.
- Consider adding a manual QA checklist comparing Review Page and email outputs.

## Open Questions

- Confirm whether LoaderV2 requires additional context beyond what the email currently passes (e.g., pagination or filters).
- Validate if any strings need i18n hooks before launch.
