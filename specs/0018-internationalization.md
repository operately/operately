# Internationalization

## Goal

Translate Operately's interface, system messages, notifications, and emails while preserving the current English experience throughout the migration. Maintain one shared translation source for React, TurboUI, and Elixir.

User-authored content, API field names, and CLI command names are outside this rollout. Brazilian Portuguese (`pt-BR`) is the first additional language, starting with the pilot and continuing through general availability.

## Design

- Use English source text as message identifiers, with context for ambiguous wording. Extract messages from frontend and backend code into one Gettext source catalog.
- Elixir and email rendering use Gettext. React and TurboUI use the existing i18next integration with generated JSON and one app-controlled language.
- Translate complete sentences with named placeholders and language-aware plurals. Support links and emphasis without assembling translated sentence fragments or injecting translated HTML.
- Keep catalogs in Git. AI may draft translations; a native speaker reviews them using a shared glossary for terms such as space, champion, and check-in.

### Catalog locations

```text
app/priv/gettext/messages.pot                   # Generated English source catalog
app/priv/gettext/<locale>/LC_MESSAGES/messages.po # Reviewed translations
app/assets/js/generated/locales/<locale>.json  # Generated i18next resources
```

The build generates English JSON from the source catalog and other languages from PO files. No separately maintained English translation file is required. Generated JSON is never edited manually. Extraction must merge both runtimes without overwriting the other's messages; conversion must preserve context, placeholders, and plural rules, with explicit locale-code mapping.

### Language and rollout

- Store a user's explicitly selected language preference. Use English until the user manually selects another language; never automatically select a language from browser settings.
- Keep language, regional formatting preferences, and timezone separate. Reuse existing formatting helpers.
- Gate the language selector and access to additional languages behind the existing company feature-flag mechanism. Catalog infrastructure and English extraction run for everyone.
- Resolve the effective language consistently for web requests and each email recipient, including buffered notifications and digests. Workers explicitly scope the locale while rendering; they cannot depend on request state.
- Disabling the flag forces English without deleting the saved preference. Unsupported languages and missing translations fall back to English.
- Translate activity presentation at render time; preserve stored activity data and user content.

## Delivery plan

**Each numbered step is a separate PR merged to production.** Every PR must work independently with the flag disabled; incomplete translations remain available only to enabled companies.

| PR | Change | Production behavior and validation |
| --- | --- | --- |
| 1 — Complete | Add Gettext, shared extraction/conversion tooling, and unified frontend initialization. Document catalog commands. | English only. Verified deterministic generation, fallback, context, placeholders, rich text, and plural conversion. Fixed missing plural translations to fall back using English plural rules; all 36 focused i18n tests pass. |
| 2 — Complete | Add the language preference, effective-language resolver, and default-off flag. | English only. Use an additive migration; verify absent preferences, unsupported locales, and flag-off behavior. Audit preference API consumers and regenerate the CLI catalog if its contract changes. |
| 3 — Complete | Extract one complete English workflow: navigation → project → task → activity notification/email. Include validation, accessible labels, and in-workflow task create/rename error toasts. | Existing English copy and behavior remain intact. Verified the workflow, immediate/buffered emails, and cataloged create/rename failure toasts (including titles). Remaining gaps found in the audit are deferred below. |
| 4 — Complete, in production | Translate the pilot workflow into Brazilian Portuguese (`pt-BR`) and add the gated language selector. | The Portuguese pilot and selector are shipped. Saved selection, recipient language, pluralization, layout, and switching the flag off are covered by the pilot. Unmigrated surfaces remain English. |
| 5 — Space administration complete; other slices tracked separately | Extract space creation/editing, general access, access management, add members, tools configuration, and shared access labels. Company administration/billing, account/onboarding, and navigation chrome/shared defaults are independent slices. | English remains unchanged. Newly extracted complete access-summary messages and the add-member accessible name have drafted Brazilian Portuguese translations. Other missing translations still fall back to English, including plurals. This completion applies only to space administration. |
| 6 | Extract remaining work-management copy: goals, projects, tasks, discussions, Docs & Files, and activity feeds. Include task-board filters/menus/milestone creation, remaining project and task operation toasts (due date, reminders, assignees, description, status, milestone, delete, move), space-task operations, and generic “Update failed” titles deferred from the pilot. | Verify representative workflows and expanded-text layouts. Include empty states, errors, tooltips, and accessibility text. |
| 7 | Extract remaining backend messages, email subjects/bodies, digests, and server-rendered pages. | Verify recipient-scoped rendering, mixed-language recipients, and unchanged API machine identifiers. |
| 8 | Complete the Brazilian Portuguese translation, terminology review, and coverage checks. | Test the full experience in English and Brazilian Portuguese with selected companies. CI checks catalog freshness and placeholder/plural integrity; establish checks against new uncataloged product copy. |
| 9 | Enable language selection by default after acceptance. | Keep the flag as a rollback switch. Verify existing users retain English and disabling the flag restores English across UI and emails. |

## Release acceptance

- All in-scope system copy is cataloged and Brazilian Portuguese has native-speaker approval.
- English behavior is preserved; no raw message keys or broken placeholders reach users.
- Representative workflows, emails, formatting, and expanded-text layouts pass review.
- Coverage gaps are tracked during migration and closed before general availability.

Pilot audit notes (after PR 3): task create/rename failure toasts, the modal Close accessible label, task notes/activity headings and fallback, the task email's plain-text link label, and digest resource labels are cataloged. Toast and modal tests use substituted translations to verify catalog lookup as well as unchanged English. Shared navigation chrome beyond the listed labels is deferred to PR 5. Remaining project/task operation copy is deferred to PR 6. Non-pilot emails are deferred to PR 7.

PR 5 is tracked in independent extraction slices. The space administration audit below establishes completion only for that slice; it does not mark company administration, billing, account, onboarding, or navigation chrome/shared defaults complete. The Portuguese pilot and gated language selector are complete in production (PR 4). FormattedTime weekday/relative labels and selector behavior remain from earlier PRs.

### Space administration extraction — complete

Audited space creation/editing, general access, access management (including Other People), member addition, and tool configuration, including labels, validation, empty states, errors, tooltips, accessibility text, and app-wrapper errors. Shared permission option labels are cataloged at the shared list; shared access-summary titles and descriptions are complete messages per resource, tense, and permission combination. Goal and project access pages remain outside this extraction.

Most space administration copy was already cataloged. This follow-up closes the remaining concatenated access-summary descriptions and the add-member button's missing accessible name. Space-tool switches expose their cataloged titles to assistive technology. The existing Other People count uses language-aware plurals; no new UI count is introduced.

`make gen.i18n` regenerates the source catalog, merges PO entries, and generates locale resources. The complete access-summary messages and add-member accessible name have Brazilian Portuguese translations drafted from the glossary and previously reviewed fragment translations. Existing reviewed translations are preserved, including obsolete entries for replaced access-summary sentences. Tests verify English, Portuguese catalog lookup, substituted catalog lookup, missing-Portuguese fallback (including Other People's singular and plural forms), and tool configuration interactions. English wording, the language flag, preference, and selector behavior are unchanged. Backend `data.message` errors assigned to forms remain as returned.

Remaining gaps before general availability:

- PR 6: work-management copy and related toasts, including space home/work map/kanban/KPI/discussion surfaces.
- PR 7: remaining backend messages and email copy, digests, and server-rendered pages.
- People directory and org-chart page copy still need extraction.
- PR 8: Remaining Portuguese coverage, terminology/native-speaker review of drafted space-administration translations, and coverage checks.

Company administration/billing/export/import, navigation chrome/shared defaults, and account/profile/authentication/onboarding belong to separate extraction slices; space administration does not depend on their completion. Operator SaaS administration is outside this slice. User-authored content (including names and emails) and machine identifiers are not translated.
