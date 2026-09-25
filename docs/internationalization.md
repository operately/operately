# Internationalization

Operately keeps one Gettext catalog as the source of truth for Elixir, React, and TurboUI copy. English source text is the message identifier. Brazilian Portuguese is the first additional language.

User-authored content, API field names, and CLI command names are not translated.

## Language preference

A person can store an explicit language separately from timezone and time-format preferences. English is the default until they select another supported language. Browser `Accept-Language` never selects or persists a language.

The `i18n` company experimental feature is off by default. While it is off, the language selector is hidden and the app and emails stay English even if a non-English preference is saved. Turning the flag off later forces English without deleting the saved preference. Missing or unsupported preferences also resolve to English.

When the flag is on, Account → Profile shows a Language picker with English and Português (Brasil). The selected language is persisted through the existing person preference API and applied to React, TurboUI, and recipient-scoped emails. Turning the flag off hides the picker and restores English without deleting the saved choice.

## Pilot setup

The Portuguese pilot and gated language selector are complete and in production. The setup below remains available for enabling additional pilot companies.

Enable the flag for an internal company only. The flag remains off by default.

1. Enable the `i18n` experimental feature for that company.
2. Open Account → Profile.
3. Choose **English** or **Português (Brasil)** and save.
4. Reload the app. Navigation, the project/task pilot, and task-adding emails should follow the saved language.

Existing users stay on English until they select another language.

## Verification

- With the flag off, the selector is hidden and web/email output stays English, including for people who already saved `pt-BR`.
- With the flag on, a missing preference, an unsupported preference, and browser language headers all resolve to English.
- Selecting a language updates the interface and survives reloads. Disabling the flag restores English; re-enabling it honors the saved preference.
- Immediate task-adding emails, buffered notifications, and digests render in each recipient's effective language for both HTML and plain text. Locale does not leak between recipients.
- Missing translations, including plural forms, fall back to English.

## Rollback

Disable the `i18n` company feature. The selector disappears and every surface returns to English. Saved language preferences are kept so the same company can turn the flag back on later.

## Terminology glossary

Use these Brazilian Portuguese terms for product nouns in the pilot and later translations:

| English | Português (Brasil) |
| --- | --- |
| company | empresa |
| member | membro |
| space | espaço |
| project | projeto |
| goal | objetivo |
| task | tarefa |
| milestone | marco |
| check-in | check-in |
| champion | champion |
| home | início |
| my work | meu trabalho |
| review | revisão |
| due date | data de conclusão |
| Docs & Files | Docs & Arquivos |
| Comments & Activity | Comentários & Atividade |
| template | Template |

AI may draft translations. A native speaker reviews them against this glossary before they ship.

## Pilot workflow

The first cataloged English workflow is company navigation → project → task → task-adding activity, notification, and email.

| Step | System copy |
| --- | --- |
| Company navigation | Home, Company, My work, Review, and the matching mobile labels (People, Notifications, Account, Company Admin, Switch Company, Log Out) |
| Project | Breadcrumbs (Home, Projects), tabs, task-completion text and accessible label, project name validation |
| Task | New task, inline creator (placeholder, Add, Cancel, Add task accessible name), creation modal labels and accessible Close button, task name validation, Mark task as done, task creation and rename failure toasts (including titles), task notes labels/placeholders, Comments & Activity heading and timeline fallback |
| Activity and notifications | Task-adding feed titles, in-app notification title, Notifications page chrome, Mark as read |
| Emails | Immediate task-adding subjects and bodies (including mentions and the plain-text link label), buffered digest subject/empty state/CTAs and resource labels (Project, Space, Goal), and the task-adding digest headline |

Desktop company-dropdown, account-menu, New, Help, search, and update-badge copy are cataloged. Account and onboarding screens are cataloged, including login, signup, forgot/reset password, first-company setup, new company, lobby, personal join, invite-link join/full, invite-team, member-type selection, invite-people/member form chrome, account home/settings/security/email/password/API tokens/MCP/notifications, remaining profile editor copy, and the member onboarding wizard. People directory and org-chart page copy stay English. Remaining project and task operations (due date, reminders, assignees, description, status, milestone, delete, move), task-board filters/menus/milestone creation, space-task operations, and generic “Update failed” titles remain English until PR 6. Other emails stay English until PR 7.

Activity presentation is translated at render time. Stored activity payloads and user-authored names stay in the original language.

Web requests and recipient-specific email rendering share the same effective-language rules. Background workers scope Gettext to the recipient for the duration of rendering and restore the previous locale afterward, including when rendering fails.

## Administration extraction — complete

Company administration (home, add/manage people, restore access, admins/owners, permissions, rename, trusted email domains, billing/plan selection/cancellation, export, and import) and space administration (create/edit, general access, access management, add members, and tool configuration) use the shared catalog.

The follow-up audit closed the remaining create-space examples, import-version warning, and import/export progress-step labels. Billing date messages now include their named date placeholder in the complete message, and plan/interval labels can be reordered by translations. Tool switches reuse the cataloged tool title as their accessible name. Administration wrapper toasts, including delete-company errors, were already cataloged and were included in the audit.

English wording and behavior are preserved. New company and space administration messages have Brazilian Portuguese translations; missing translations still fall back to English. Reviewed translations remain intact; translations for superseded billing sentence fragments are retained as obsolete PO entries. Focused tests exercise English, substituted catalog messages, missing-Portuguese fallback, invitation-expiry plurals, and company/space administration interactions.

Remaining coverage gaps:

- Work-management copy: goals, projects, tasks, discussions, Docs & Files, activity feeds, space home/work map/kanban/KPI/discussion pages, and their operation toasts.
- Remaining backend messages, emails, digests, and server-rendered pages, including transfer errors delivered by the backend.
- People directory and org-chart page copy.
- Complete Brazilian Portuguese coverage, native-speaker review of new messages, and automated coverage checks.

Navigation/shared-default and account/onboarding extraction are separate rollout slices. User-authored names, emails, domains, file names, version values, and API identifiers stay outside translation lookup. Known transfer step identifiers are mapped to cataloged display labels without changing the identifiers sent by the API.

## Catalog files

```text
app/priv/gettext/messages.pot                      # Generated English source catalog
app/priv/gettext/<locale>/LC_MESSAGES/messages.po  # Reviewed translations
app/assets/js/generated/locales/<locale>.json      # Generated i18next resources
```

Do not edit generated JSON by hand. English JSON is produced from the POT file; other languages are produced from PO files.

## Commands

From the repository root:

```bash
make gen.i18n
```

From `app/`:

```bash
mix operately.i18n.extract   # Scan Elixir and frontend code, write POT, merge PO files
mix operately.i18n.convert   # Write i18next JSON from POT/PO
```

Extraction unions Elixir and frontend messages. Re-running extract does not drop the other runtime's strings or overwrite reviewed PO translations. Frontend extraction uses the installed TypeScript parser and requires Node and the app's npm dependencies (installed by `make dev.build`). Files are parsed together in one Node process.

The default scan includes `.ex`, `.exs`, and `.heex` files under `app/lib` and `app/ee/lib`, plus `.js`, `.jsx`, `.ts`, and `.tsx` files under `app/assets/js`, `app/ee/assets/js`, and `turboui/src`. Configuration and scripts outside these directories are not scanned. Test files, generated files, and dependencies are excluded. HEEx expressions and attributes, including inline `~H` sigils, are parsed with Phoenix's template engine. Invalid Elixir, HEEx, or frontend syntax in scanned translation sources stops extraction with an error.

Extraction preserves locale headers and translator metadata. Messages missing from the source become obsolete (`#~`) in PO files and are excluded from generated JSON. If the source message returns, extraction restores its saved translation.

If a message switches between singular and plural, or its plural source text changes, extraction clears the incompatible translation for review. Missing plural translations are omitted from locale JSON so i18next falls back to the current English resources and applies English plural rules. Existing translated forms remain available.

## Marking copy

Elixir:

```elixir
use Gettext, backend: OperatelyWeb.Gettext

gettext("Save")
gettext("Hello %{name}", name: name)
ngettext("1 task", "%{count} tasks", count)
pgettext("button", "Close")
```

React and TurboUI:

```ts
import { useTranslation, Trans } from "react-i18next";
import { tn } from "@/i18n";

const { t } = useTranslation();

t("Save");
t("Hello {{name}}", { name });
t("Close", { context: "button" });
tn("1 task", "{{count}} tasks", count);
tn("1 task", "{{count}} tasks", count, { context: "inbox" });
<Trans i18nKey="Click <link>here</link> to continue" components={{ link: <a href="/help" /> }} />;
<Trans i18nKey={"Save"} />;
```

Outside React components, `import i18n from "@/i18n"` and `i18n.t("Save")` are also supported. Keep message identifiers as literal strings so extraction can find them.

The app and TurboUI share catalog lookup settings, including the `|` context separator, so translations work whichever package initializes i18next first.

Named placeholders, context, plurals, and rich-text tags are preserved when converting Gettext catalogs to i18next JSON. Locale directories use Gettext names (`pt_BR`); generated JSON uses BCP 47 (`pt-BR`). Missing translations fall back to English.

Plural conversion maps i18next categories to Gettext translation indexes explicitly. For Brazilian Portuguese, `_zero`, `_many` (whole millions), and `_other` use `msgstr[1]`. The explicit `_zero` override prevents zero counts from selecting a hardcoded singular such as `1 membro`. If the plural translation is missing, `_zero` uses the English plural source so it cannot fall through to the translated singular.
