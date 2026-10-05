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

**Each numbered step is a separate PR merged to production, except PR 7, which is delivered through the sub-PRs below.** Every PR must work independently with the flag disabled; incomplete translations remain available only to enabled companies.

| PR | Change | Production behavior and validation |
| --- | --- | --- |
| 1 — Complete | Add Gettext, shared extraction/conversion tooling, and unified frontend initialization. Document catalog commands. | English only. Verified deterministic generation, fallback, context, placeholders, rich text, and plural conversion. Fixed missing plural translations to fall back using English plural rules; all 36 focused i18n tests pass. |
| 2 — Complete | Add the language preference, effective-language resolver, and default-off flag. | English only. Use an additive migration; verify absent preferences, unsupported locales, and flag-off behavior. Audit preference API consumers and regenerate the CLI catalog if its contract changes. |
| 3 — Complete | Extract one complete English workflow: navigation → project → task → activity notification/email. Include validation, accessible labels, and in-workflow task create/rename error toasts. | Existing English copy and behavior remain intact. Verified the workflow, immediate/buffered emails, and cataloged create/rename failure toasts (including titles). Remaining gaps found in the audit are deferred below. |
| 4 — Complete, in production | Translate the pilot workflow into Brazilian Portuguese (`pt-BR`) and add the gated language selector. | The Portuguese pilot and selector are shipped. Saved selection, recipient language, pluralization, layout, and switching the flag off are covered by the pilot. Unmigrated surfaces remain English. |
| 5 — Complete | Extract remaining shared controls, account/onboarding screens, and company/space administration copy, including billing, export/import, and desktop company-dropdown, account-menu, New, Help, search, and update-badge chrome deferred from the pilot. | English remains unchanged. Extraction and follow-up audits cover these surfaces, including validation, errors, tooltips, and accessibility text. Existing translations are preserved; missing translations fall back to English, including plurals. Remaining Portuguese coverage and native-speaker review belong to PR 8. |
| 6 — Implemented locally; ready for review | Extract remaining work-management copy: goals, projects, tasks, discussions, Docs & Files, and activity feeds. Include task-board filters/menus/milestone creation, remaining project and task operation toasts (due date, reminders, assignees, description, status, milestone, delete, move), space-task operations, and generic “Update failed” titles deferred from the pilot. | Work-management extraction is complete, including lifecycle forms, shared presentation, task boards, templates, and activity feeds. New messages have Brazilian Portuguese drafts. Catalog integrity, English/fallback behavior, pluralization, frontend builds, focused regressions, browser workflows, and representative narrow-screen/expanded-text layouts are verified. Pending review and merge; native-speaker approval remains PR 8. |
| 7 — In progress | Extract remaining backend messages, email subjects/bodies, digests, and server-rendered pages. | Verify recipient-scoped rendering, mixed-language recipients, and unchanged API machine identifiers. |
| 8 | Complete the Brazilian Portuguese translation, terminology review, and coverage checks. | Test the full experience in English and Brazilian Portuguese with selected companies. CI checks catalog freshness and placeholder/plural integrity; establish checks against new uncataloged product copy. |
| 9 | Enable language selection by default after acceptance. | Keep the flag as a rollback switch. Verify existing users retain English and disabling the flag restores English across UI and emails. |

### PR 7 — backend and email substeps

PR 7 is an umbrella milestone. Each sub-PR is independently deployable and includes extraction, Brazilian Portuguese drafts, regenerated catalogs, and focused English/Portuguese/fallback tests. Email changes verify recipient-scoped rendering and flag-off behavior. Preserve user-authored content, API machine identifiers, permissions, and delivery behavior. Native-speaker approval remains PR 8.

| Sub-PR | Scope | Status |
| --- | --- | --- |
| 7a | Goal, project, milestone, and task notification email subjects and HTML/plain-text bodies, including lifecycle events, assignments, check-ins, and acknowledgements. | Implemented locally; ready for review |
| 7b | Discussion, comment, Docs & Files, and remaining activity emails. | Implemented locally; ready for review |
| 7c | Buffered notification item copy and digest subjects/bodies, including mixed-language recipients. | Implemented locally; ready for review |
| 7d | Account, invitation, onboarding, security, and billing emails. | Implemented locally; ready for review. External SendGrid onboarding coverage remains open. |
| 7e | Remaining backend user-facing messages and server-rendered pages. | Implemented locally; ready for review |

7a covers implemented immediate notification emails. Existing unsupported email stubs remain unsupported. Discussion/comment emails belong to 7b even when attached to goals, projects, milestones, or tasks. Buffered-item headlines and digest composition belong to 7c; existing pilot translations remain intact. Remaining frontend extraction is tracked separately from PR 7.

### PR 7a — work notification emails

The 37 remaining implemented goal/project/milestone/task immediate email templates now use the shared catalog for subjects, HTML, and plain text. The previously translated task-creation email is preserved. This adds 197 messages with Brazilian Portuguese drafts; existing translations are retained. Complete subjects include the actor and location in named placeholders. Role labels and acknowledgement CTAs are translated without changing stored role/status identifiers or acknowledgement links.

The catalog extractor now scans `.eex` templates using EEx, preserving source references and nested control flow. Goal and project check-in summaries share complete translated status/deadline sentences with catalog-owned emphasis and language-aware plurals. User-written names, descriptions, notes, and links remain literal. Shared deadline rendering handles due today and uses singular week/month forms; timeline emails handle persisted ISO dates and explicitly translate zero-day durations. Existing date display conventions remain unchanged; regional formatting follow-ups stay separately tracked.

The 132 focused email, worker, and catalog tests pass. Validation covers every newly migrated HTML/plain-text template, missing-locale English fallback, literal names and escaping, success/removal branches, Portuguese mention emails, zero/singular/plural durations, recipient-scoped worker delivery to English and Portuguese recipients, and English rendering with the company flag disabled. Catalog regeneration is checked for determinism, placeholder/plural integrity, complete translations of new messages, and preservation of existing translations. Buffered-item headlines and digest composition remain 7c work. Native-speaker approval remains PR 8. This implementation has not been merged or deployed.

### PR 7b — discussion, comment, and resource emails

The 24 implemented immediate emails for space/goal/project discussions, comments (including check-ins, retrospectives, milestones, tasks, and KPI entries), Docs & Files, and space-member additions now use the shared catalog for complete subjects, HTML/plain-text headings, and actions. This adds 71 email messages with Brazilian Portuguese drafts. Regeneration also picks up four previously marked frontend comment/reaction messages missing from the checked-in catalog; these receive drafts as well. Existing translations are retained.

Comment subjects and headings use complete sentences for each supported parent activity. Document creation/copying and mention subjects retain their existing branches. Single-file uploads preserve the literal filename and file destination; multi-file uploads use language-aware plurals and retain the folder/hub destination. Milestone comment/complete/reopen identifiers and rich-content behavior are unchanged. User-authored names, content, URLs, and legacy English wording remain literal and intact, including the existing document-copy plain-text wording.

All 149 focused email, worker, buffered-delivery regression, and catalog tests pass. Validation covers every migrated HTML/plain-text template, English/Portuguese/missing-locale fallback, literal-name escaping, branching subjects, upload counts and destinations, milestone actions, discussion parent contexts, recipient-scoped worker delivery, and English rendering with the company flag disabled. Catalog checks verify deterministic generation, matching placeholders/plurals, and preservation of existing translations.

Buffered-item headlines and digests remain 7c work. Company account, invitation, restoration, role/access, guest, security, and billing emails remain 7d work. Unsupported immediate-email stubs remain unsupported. Native-speaker review remains PR 8. This implementation has not been merged or deployed.

### PR 7c — buffered notifications and digests

The 60 remaining implemented buffered-item renderers now use the shared catalog; the task-creation pilot is preserved. Complete action headlines include named resource, person, date, and count placeholders. Check-in status and document-copy branches translate whole phrases while keeping stored identifiers and user content intact. Author attribution, parent/author grouping, chronology, links, excerpts, and delivery behavior are unchanged. Unsupported buffered-item stubs remain unsupported.

The buffered and daily activity-digest subjects, resource labels, actions, settings links, and empty states retain the pilot translations. Zero-update Portuguese subjects now explicitly say zero instead of selecting the singular “1 update” form. Recipient locale remains scoped around both item construction and rendering in the existing workers.

The daily work-summary email now catalogs its subject, HTML/plain-text introduction, space labels, due-date/reminder details, and system-authored assignment actions. Task, milestone, KPI, space, project, and company names remain literal. Assignment labels are translated only in email presentation; API labels and machine identifiers are unchanged. Sorting still uses the original labels so translation does not reorder work. Reminder eligibility, schedules, and date display conventions are preserved.

This slice adds 104 messages with Brazilian Portuguese drafts and regenerated POT/PO/JSON resources. Existing nonempty translations are retained. All 195 focused email, worker, scheduling, and catalog tests pass. Validation covers all 61 implemented buffered renderers, English/Portuguese/missing-locale fallback, unchanged item metadata, assignment/date/copy/upload/milestone/status branches, singular/plural counts, empty digests, escaped user content, work-summary ordering, mixed-language recipients, and flag rollback across buffered, daily, and work-summary delivery. Catalog checks verify deterministic generation, matching placeholders/plurals, and preservation of existing translations.

Account, invitation, onboarding, security, and billing emails remain 7d; remaining backend messages and server-rendered pages remain 7e. Native-speaker review remains PR 8. This implementation has not been merged or deployed.

### PR 7d — account, invitation, security, and billing emails

The 16 locally rendered email types for company invitations, guest access, member restoration/conversion, owner/admin/access changes, login confirmation, password resets, email changes, and billing alerts now use the shared catalog for complete subjects and HTML/plain-text content. This adds 78 messages with Brazilian Portuguese drafts; existing translations and glossary terms are preserved. Access labels are translated only for email presentation. Account identifiers, stored access levels, invitation tokens, verification codes, reset links, recipients, and security expiry rules remain unchanged.

Account-level emails have no company context or account-level language preference. They use a language only when all active company memberships resolve to the same effective language; absent preferences, unsupported languages, conflicting memberships, and new accounts resolve to English. Suspended memberships are excluded. Rendering explicitly scopes and restores the locale. New email-change notification jobs store the account ID so later address changes cannot change whose preference is used; previously queued jobs without an account ID remain supported and use English. The code sent to a proposed new address uses the existing account's preference.

Billing alerts resolve language from each recipient and the alert's company at delivery time. Recipients sharing a language retain a single message; mixed-language groups receive separate localized messages. Flag-off delivery retains the existing English message and recipient grouping. Eligibility, deduplication, scheduling, retry errors, and billing limits are unchanged. Company activity emails retain the existing recipient-scoped notification worker. Catalog-owned email emphasis preserves literal, escaped addresses without interpreting translated HTML.

All 293 focused email, worker, catalog, preview, and API/security tests pass. Validation covers the migrated templates and subjects, English/Portuguese/missing-locale fallback, invitation/login branches, access labels, literal names and addresses, unchanged tokens/codes/links, mixed-language billing workers, account-language conflicts, flag rollback, legacy/new email-change jobs, and email-change API/security regressions. Catalog checks verify deterministic POT/PO/JSON generation, matching placeholders, and preservation of existing translations. API contracts and machine identifiers are unchanged; no CLI catalog regeneration is needed.

**External onboarding coverage remains open:** `OperatelyEE.AccountOnboardingJob` only registers contacts with a SendGrid marketing list. The onboarding email templates and automation are managed outside this repository; there is no local subject/body to extract or language-aware campaign configuration to update here. Local account confirmation/invitation emails are covered above. The SendGrid campaign needs a separate content and locale-routing audit before general availability. Native-speaker review remains PR 8; remaining backend messages and server-rendered pages remain 7e. This implementation has not been merged or deployed.

### PR 7e — backend messages and server-rendered pages

Backend API and input-validation messages, billing-limit explanations, sanitized import/export failures, activity access labels, MCP tool errors, and browser authorization pages now use the shared catalog. Markdown exports catalog their headings, labels, empty states, and complete activity sentences. This adds 282 messages with Brazilian Portuguese drafts; existing nonempty translations are preserved. Due-date wording follows “data de conclusão”. User content, custom task-status labels, identifiers, protocol error categories, OAuth parameters, and stored diagnostics remain unchanged.

Account-only requests reuse the active-membership language policy from 7d. MCP consent resolves the selected company's effective language, including when account memberships disagree. Markdown downloads resolve language after loading the company and membership from the URL. Unauthenticated requests remain English, browser language is ignored, and disabling the company flag restores English. Server-rendered HTML declares the effective language; catalog-owned emphasis escapes client names and translated text.

Member and guest validation errors now include additive `details.field` metadata. The add-person form uses that identifier to place translated errors instead of inspecting English words. Its existing TanStack Query flow, TurboUI `CompanyAdminAddPeoplePage` and `InviteMemberForm`, and `showErrorToast` remain in use. No new interactive elements are introduced. API/MCP/CLI consumers were audited; endpoint inputs, successful output schemas, command names, and permissions are unchanged. The CLI catalog is regenerated and checked for compatibility; its only generated change is enum ordering, with command names and flags unchanged.

Import/export workers continue storing stable diagnostics; serializers translate sanitized explanations when read. Access-label translation is shared with the existing permissions email. Machine-facing API documentation, MCP schemas and protocol status names, logs, persisted custom labels, and user-authored content remain literal. Existing date/number formatting conventions are preserved; regional-formatting follow-ups remain separate.

Validation covers English regressions, Portuguese rendering, missing-locale fallback, flag rollback, conflicting account memberships, literal names and escaping, zero/singular/plural validation counts, stable error categories and field metadata, Markdown exports, and unchanged external API authorization. Focused backend regressions, eight Jest tests, TypeScript checks, and the CLI catalog sync check pass. Catalog checks verify deterministic POT/PO/JSON generation, matching placeholders/plurals, and preservation of existing translations. Native-speaker review remains PR 8. This implementation has not been merged or deployed.

## Release acceptance

- All in-scope system copy is cataloged and Brazilian Portuguese has native-speaker approval.
- English behavior is preserved; no raw message keys or broken placeholders reach users.
- Representative workflows, emails, formatting, and expanded-text layouts pass review.
- Coverage gaps are tracked during migration and closed before general availability.

Pilot audit notes (after PR 3): task create/rename failure toasts, the modal Close accessible label, task notes/activity headings and fallback, the task email's plain-text link label, and digest resource labels are cataloged. Toast and modal tests use substituted translations to verify catalog lookup as well as unchanged English. Shared navigation chrome beyond the listed labels is deferred to PR 5. Remaining project/task operation copy is deferred to PR 6. Non-pilot emails are deferred to PR 7.

PR 5 extraction is complete across shared controls, navigation chrome, account/onboarding, and company/space administration. The work was delivered through #5357 (shared, account, and administration extraction), #5362 (remaining account/onboarding copy), #5366 (remaining company/space administration copy), and the space administration follow-up below. Company administration includes billing, export, and import. The People directory, org chart, and linked profiles are covered by the follow-up below. Additional extraction gaps are tracked in the repository audit below. The Portuguese pilot and gated language selector are complete in production (PR 4). FormattedTime weekday/relative labels and selector behavior remain from earlier PRs.

### Space administration extraction — complete

Audited space creation/editing, general access, access management (including Other People), member addition, and tool configuration, including labels, validation, empty states, errors, tooltips, accessibility text, and app-wrapper errors. Shared permission option labels are cataloged at the shared list; shared access-summary titles and complete sentences are cataloged, with resource names included in each base sentence. Goal and project access pages remain outside this extraction.

Most space administration copy was already cataloged. This follow-up closes the add-member button's missing accessible name. Access summaries retain independently translated complete sentences. Space-tool switches expose their cataloged titles to assistive technology. The existing Other People count uses language-aware plurals; no new UI count is introduced.

`make gen.i18n` regenerates the source catalog, merges PO entries, and generates locale resources. The add-member accessible name has a Brazilian Portuguese translation drafted from the glossary. Existing reviewed access-summary translations are preserved. Tests verify English, Portuguese catalog lookup, substituted catalog lookup, missing-Portuguese fallback (including Other People's singular and plural forms), and tool configuration interactions. English wording, the language flag, preference, and selector behavior are unchanged. Backend `data.message` errors assigned to forms remain as returned.

### Work-management extraction — final implementation

Goal/project overview panels, goal creation, task-board and milestone controls, task operation errors (including generic “Update failed”), resource menus/empty states, space home/discussion/work-map controls, and initial KPI/activity presentation now use the catalog. New messages in this batch have Brazilian Portuguese translations drafted from the glossary. Stored activity payloads and user names remain unchanged.

Validation includes substituted translations, Portuguese catalog lookup, missing-Portuguese fallback, zero/singular/plural completed-milestone counts, English with a saved Portuguese preference and the flag disabled, and an expanded-text milestone dialog Storybook interaction. Catalog generation preserves existing translations and is checked for determinism. The final implementation catalogs the following previously open client-authored surfaces:

- Goal access pages, check-in/closing/reopening forms, target/checklist editors, and remaining contributor presentation
- Project add/check-in/closing/pause/resume/retrospective forms and check-in presentation
- Remaining shared work-management fields, status customization/display, subscription/comment/timeline presentation, and milestone-completion copy
- Remaining task-board sentences and accessibility text, including selected filter descriptions and Kanban add-status presentation
- Project-template selection, creation, lifecycle, and template project/task/discussion/Docs & Files flows
- Shared editor, date/time control, reaction, and slide-in labels used by these workflows

### Discussions, Docs & Files, and space-board extraction — cataloged

This follow-up catalogs space/goal/project discussion composers and drafts; shared discussion scheduling, discard, and publication presentation; Docs & Files upload/add/editor/file/document/version-history/comparison/restore surfaces and their app-supplied feedback; work-map tabs, timeline/row summaries and empty states; space-home progress/completion summaries; kanban page titles; and KPI detail/sidebar/history/log/edit/delete/comment presentation.

Existing catalog entries and TurboUI primitives are reused. Resource names stay in sentence placeholders; user content and machine identifiers are not translated. English wording, permissions, interactions, formatting helpers, the language flag/selector, and stored activity payloads are preserved. New messages have Brazilian Portuguese translations drafted from the glossary. Reviewed PO translations are retained. Native-speaker review remains PR 8 work.

Verification covers substituted translations in components and app bridges, success/empty/error states, saved Portuguese preferences with the flag off, and missing-Portuguese fallback including zero/singular/plural folder counts and upload/progress states. An expanded-catalog document-history Storybook interaction checks heading/confirmation layout and restore controls. Catalog generation, targeted Jest, TurboUI tests/build, and TypeScript checks are required for the slice.

The final PR 6 implementation above also catalogs project-template workflows and the remaining shared work-management presentation. People directory/org-chart/profile extraction is covered by the follow-up below. Portuguese/native-speaker review, additional audit findings, formatting follow-ups, and language-selection rollout remain separate work. Earlier extraction remains intact.

### Remaining activity-feed extraction — cataloged

Audited all activity handlers, including handlers registered but not currently displayed in the feed. The previously extracted `TaskAdding`, `GoalCreated`, `ProjectCreated`, `TaskNameUpdating`, and `TaskDescriptionChange` handlers retain their completed catalog work. The remaining company/member/guest/space, goal/project/milestone/task, discussion/comment, Docs & Files, and KPI handlers now look up feed titles, UI-composed bodies, in-app notification titles, fallback labels, and handler-owned detail-page labels at render time.

Complete sentences replace `feedTitle` fragments. Named placeholders keep user-authored resource names and links within the sentence; page-context variants include the relevant goal/project/space noun. Counts include company access changes, assignees, timeline milestone summaries, and timeframe/duration presentation. Existing English wording is preserved, including legacy “1 days” wording. An activity-scoped `Trans` adapter preserves literal user names while rendering catalog-owned rich-text tags. No stored activity payloads, permissions, interactions, formatting preferences, or language-flag/selector behavior change.

New activity sentences have Brazilian Portuguese drafts from the glossary. Reviewed translations remain intact. `intlRelativeDateTime` stays an interpolation key. Native-speaker review remains PR 8 work. Verification includes targeted activity Jest tests and TypeScript checks, substituted translations, saved Portuguese preferences with the flag disabled, missing-Portuguese fallback at zero/one/many counts, page-context wording, link destinations, literal names, KPI bodies/notifications, and detail labels. `make gen.i18n` regenerates POT/PO/JSON resources and is checked for deterministic output and placeholder/plural integrity.

The handler extraction is preserved. The final PR 6 implementation also catalogs shared feed/timeline/comment/subscription chrome, client-owned status and permission presentation, goal/project lifecycle forms, task-board descriptions, and template workflows. Backend-supplied status/access labels and unknown legacy role labels stay as stored. Older cataloged activity handlers retain their rendering implementation; extending rich-text name escaping in those handlers remains separate follow-up work.

### Final PR 6 validation

The catalog contains 2,931 active messages, with Portuguese translations or drafts for 2,930. `intlRelativeDateTime` remains an intentional interpolation key. This measures catalog coverage, not coverage of the entire product. Existing nonempty translations are preserved. Native-speaker approval remains PR 8 work.

The shared TurboUI `Trans` adapter preserves literal user names and supports reordered rich sentences. Extraction recognizes its public and relative imports. Named link tags use `<resource>` to avoid HTML void-element parsing. Check-in month/date headings reuse `FormattedTime` with explicit formatting preferences. Expanded translated confirmation actions wrap within the dialog at narrow widths.

Validation covers English, Portuguese, substituted translations, missing-language fallback and plurals, literal names/link destinations, language switching, recipient-selection counts, template lifecycle callbacks, and timezone-sensitive check-in dates. App and TurboUI TypeScript checks and production builds pass. The Elixir i18n suite passes 55 tests, and 127 app bridge tests pass. The full TurboUI run passed 1,305 tests; three timing-sensitive failures passed targeted reruns (SearchPage needed a longer local timeout). Two template lifecycle Storybook interactions pass. Browser review covers Portuguese goal, check-in, template, and Kanban surfaces at 375px, plus an expanded-text confirmation dialog; the dialog overflow found during review is fixed. The Portuguese check-in feature verifies literal content, unchanged status identifiers, and English rendering with the flag disabled. English check-in submission and space-template duplicate/archive/restore/delete regressions pass isolated reruns with longer local browser-test timeouts. Company-template lifecycle, template permissions, generated-project preservation, check-in editing, project pause/resume, and goal checklist workflows also pass. PR 6 is implemented locally and ready for review; it has not been merged or deployed.

Remaining gaps before general availability:

- Review and merge the local PR 6 implementation. Full-product acceptance with selected companies remains PR 8 work.
- PR 7: review and merge the local 7a–7e implementations. Audit the external SendGrid onboarding campaign and locale routing to close 7d’s external coverage gap.
- Close the remaining product-copy gaps identified in the repository audit below. People directory, org-chart, and profile extraction is implemented locally.
- PR 8: Remaining Portuguese coverage, terminology/native-speaker review of drafted translations, and coverage checks.

Operator SaaS administration is outside PR 5's scope. User-authored content (including names and emails) and machine identifiers are not translated.

### People directory, org chart, and profiles — implemented locally

These surfaces now use the shared catalog, with 14 Brazilian Portuguese drafts and contextual translation of “Reports”. Directory/chart presentation uses TurboUI; user content, navigation, and existing behavior are preserved. Native-speaker review remains PR 8; not merged or deployed.

Validation passes: 14 component tests, 30 app tests, 29 browser tests, TypeScript checks, builds, catalog integrity/determinism, and 375px layout review. Coverage includes English/Portuguese, fallback, plurals, flag rollback, and literal user content.

### Home and Review — implemented locally

Headings, greetings, actions, empty/error states, assignment labels, and urgency/count messages now use the shared catalog, with 24 Portuguese drafts. Due-date wording follows “data de conclusão”. Existing TurboUI controls, user content, API identifiers, and sorting are preserved. Native-speaker review remains PR 8; not merged or deployed.

Validation covers English/Portuguese, fallback, plurals, flag rollback, literal names, feed errors, and 375px expanded-text layouts. All 84 focused component/app/catalog/browser tests, TypeScript checks, and builds pass. Catalogs regenerate deterministically without changing existing translations.

### Company banners and release announcements — implemented locally

Billing messages and announcement controls now use the shared catalog, with 15 Portuguese drafts. Billing and site-message presentation uses TurboUI; complete sentences retain formatted deadlines. Operator content, eligibility, destinations, and dismissal behavior are preserved. Billing actions stack and wrap at narrow widths. Native-speaker review remains PR 8; not merged or deployed.

Validation passes: 44 component/app tests, 18 browser workflows, TypeScript checks, builds, catalog integrity/determinism, and Portuguese/expanded-text review at 375px. One cancellation-page browser test still fails in isolation, redirecting to a Free-plan billing overview; this route hides the banner and needs separate billing-fixture investigation.

### Additional extraction gaps

The source audit confirmed these remaining surfaces:

- Error/public pages: ErrorPage, NotFoundPage, BillingPickCompanyPage, and PublicDocumentPage.
- Shared controls: OtherPeopleWithAccess, SidebarSection notifications, WorkMapTable next-step heading, SortControl, and ContinueEditingDrafts counts.
- Dates: TimeframeSelectorDialog labels and RelativeWeekdayOrDate’s assembled “this” + weekday phrase.

This inventory is not exhaustive runtime coverage. PR 8 acceptance, external SendGrid onboarding, formatting follow-ups, and older activity rich-text escaping remain open. User content and operator SaaS administration remain excluded.
