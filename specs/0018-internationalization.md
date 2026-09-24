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
| 4 — Complete | Translate the pilot workflow into Brazilian Portuguese (`pt-BR`) and add the gated language selector. | Enable for an internal company only. Verify saved selection, recipient language, pluralization, layout, and switching the flag off. Unmigrated surfaces remain English. |
| 5 — Complete | Extract remaining shared controls, account/onboarding screens, and company/space administration copy. Include desktop company-dropdown, account-menu, New, Help, search, and update-badge chrome deferred from the pilot. | English remains unchanged; pilot users receive English fallback for newly extracted messages. Audit these surfaces for untranslated literals. |
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

PR 5 coverage: remaining shared controls (confirm dialogs, form defaults/validation, copy-to-clipboard, access selectors, date/person dropdowns), account and onboarding screens, company/space administration, billing administration copy, and deferred navigation chrome (company dropdown, account menu, New, Help, search, update badge, keyboard shortcuts) are cataloged. Leftover account/onboarding copy from that pass is now cataloged too: personal join, first-company setup companions, login/signup/forgot/reset, lobby, invite-link join/full, invite-team, member-type selection, invite-people/member form chrome, account home/settings/security/email/password/API tokens/MCP/notifications, remaining profile editor copy, and the member onboarding wizard. English identifiers are unchanged. Personal join, member onboarding, and profile-avatar messages include Portuguese translations; missing translations, including plurals, still fall back to English. People directory and org-chart page copy stay coverage gaps for this slice. Remaining work-management copy belongs to PR 6. Remaining backend messages and emails belong to PR 7. FormattedTime weekday/relative labels and the language selector remain from earlier PRs. Work-management access summaries used on project/goal forms were cataloged with space administration because they share the same control.
