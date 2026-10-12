# Spanish implementation and verification

Spanish uses `es` in both Gettext and BCP 47 and appears as **Español** in the existing profile language dropdown. English remains the default. The shared effective/account-language resolvers retain company rollback and conflicting-membership behavior.

## Catalog and consumers

- The shared Spanish catalog covers all 4,399 active extracted messages, including enterprise messages, email subjects/bodies, activity presentation, exports, validation, and emoji-search aliases. The standard Ecto errors domain is translated too.
- Spanish plurals have three explicit indexes: `one` (0), `many` (1), and `other` (2). The merger initializes all forms from the PO header and preserves them across generation.
- App/TurboUI language unions and the external API/CLI catalog are generated. The profile update accepts `es` through the existing enum. MCP tools do not accept a language preference; they reuse the existing request resolver and shared translated errors. CLI command names and machine identifiers remain unchanged.
- The profile selector reuses TurboUI `Dropdown` and the existing page/form controls. No new raw interactive controls were introduced.
- `Title in Company` distinguishes the invitation's professional position from content titles. `Reports` retains its existing `people` context.

## Verification

Passed: catalog completeness, app/TurboUI TypeScript checks, CLI catalog sync, language registries, effective/account resolution, PO merging, converter plural boundaries, catalog determinism, Spanish placeholder/tag integrity and generated-resource freshness, profile persistence, API profile update, immediate task emails, buffered delivery, work-summary digest, password-reset emails, and mixed-language billing delivery.

TurboUI: 1,519 unit tests passed. Storybook: 773 tests passed on the initial run; the single failing toast interaction passed its focused rerun together with the profile stories (10 tests). The separate browser suite passed all six tests.

Plural runtime tests cover 0, 1, 2, 0.5, 1.5, 2.5, 999,999, 1,000,000, 1,000,001, 2,000,000, and 2,000,001. Tests assert raw count values rather than imposing regional punctuation.

Profile screenshots: [desktop](screenshots/es-profile-desktop.png) and [375px](screenshots/es-profile-mobile.png). The narrow profile has no horizontal overflow; example names, titles, and biography remain literal.

## Remaining acceptance work

This implementation is not a claim of full-product release acceptance. Catalog drafts received terminology corrections and automated integrity checks, but exhaustive linguistic/runtime review of every surface remains necessary. No native-speaker review occurred.

The external SendGrid onboarding campaign remains inaccessible from this repository: `OperatelyEE.AccountOnboardingJob` only upserts a marketing contact into a configured list. Its campaign subjects, bodies, automation, and locale routing are managed outside Git. The campaign owner must supply those resources or close that integration gap before full-product Spanish completeness can be verified. Historical rollout notes in the spec do not change the current optional native-review policy.
