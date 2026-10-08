# Internationalization

Operately uses one Gettext catalog for Elixir, React, and TurboUI. English source text is the message identifier; context distinguishes ambiguous wording. Elixir and email rendering use Gettext, while the frontend uses i18next resources generated from the same catalog.

So far supported languages are English (`en`) and Brazilian Portuguese (`pt-BR`). Supported-language registries live in [Elixir](../app/lib/operately/i18n/languages.ex) and [TypeScript](../app/assets/js/i18n/languages.ts).

To add another language, follow the [internationalization skill](../.agents/skills/internationalization/SKILL.md) and its [new-language reference](../.agents/skills/internationalization/references/adding-a-language.md), starting with glossary preparation.

## Required for every copy change

**Hardcoded system-authored, user-visible text is forbidden.** All new or changed copy must use the shared translation infrastructure, include translations for every supported language, and regenerate catalogs and resources in the same PR.

This applies to the app and shared components, tooltips, accessibility labels, validation and error messages, notifications, activity feeds, exports, server-rendered pages, and email subjects and HTML/plain-text bodies.

User-authored content, machine identifiers and protocol fields, developer-only diagnostics/logs, and proper names that require no translation are excluded. If diagnostics are shown to users, provide a translated presentation. Preserve stored activity payloads and translate system-authored presentation at render time.

Use complete sentences with named placeholders and language-aware plurals. Do not concatenate translated sentence fragments, interpolate values into message identifiers, or inject translated HTML. Keep language, timezone, and regional formatting preferences separate; reuse the existing formatting helpers.

## Terminology glossary

Use the glossary for each target language:

- [Português (Brasil)](i18n/glossaries/pt-BR.md)
- [Deutsch](i18n/glossaries/de.md)
- [Русский](i18n/glossaries/ru.md)
- [Français](i18n/glossaries/fr.md)
- [Glossary template](i18n/glossaries/template.md)

Start each new language from the glossary template, then expand its glossary with as many terms, phrases, and usage notes as needed for consistent product copy and documentation. Each language can have its own additional entries.

Keep terminology in these files rather than duplicating it in guides or skills. AI drafts must follow the glossary. Native-speaker review is recommended when available for glossaries and translations, including new languages, but is not feasible for every language and is optional. Missing native-speaker approval or review metadata must not block translation, merge, or release and is not itself a review finding. New or changed glossary terms need particular attention because they affect copy throughout the product.

## Language resolution

A person selects a language explicitly in Account → Profile. English is the default for absent or unsupported preferences; browser language never selects or persists a preference. Language is stored separately from timezone and time-format preferences.

Web requests and emails use the same effective-language rules. Background workers must scope the locale while constructing and rendering each recipient's content, including buffered notifications and digests, and restore the previous locale afterward. Never rely on request state in a worker. Billing emails group recipients by effective language within the billing company.

Account-level pages and security emails have no company context. `AccountLanguage` uses the shared effective language only when all active company memberships agree; no memberships or conflicting preferences resolve to English. Suspended memberships are excluded. Unauthenticated requests use English. Use the existing resolvers rather than introducing browser detection or independent locale state.

## Catalog files and generation

```text
app/priv/gettext/messages.pot                      # Generated English source catalog
app/priv/gettext/<locale>/LC_MESSAGES/messages.po  # Translation source for each language
app/assets/js/generated/locales/<locale>.json      # Generated i18next resources
```

Edit translations in PO files. Never edit generated JSON or maintain a separate English translation file. English JSON comes from the POT; other languages come from PO files. [Locale mapping](../app/lib/operately/i18n/locale.ex) connects Gettext names such as `pt_BR` to BCP 47 names such as `pt-BR` and maps plural categories explicitly.

From the repository root, with the development environment available:

```bash
make gen.i18n
```

The individual commands, run from `app/` inside the development container, are:

```bash
mix operately.i18n.extract   # Extract messages and merge PO files
mix operately.i18n.convert   # Generate i18next JSON
```

Extraction scans Elixir, HEEx, and EEx under `app/lib` and `app/ee/lib`, and JavaScript/TypeScript under `app/assets/js`, `app/ee/assets/js`, and `turboui/src`. It excludes tests, generated files, and dependencies. Frontend extraction needs Node and the installed TypeScript parser. Invalid source syntax stops extraction; configuration and scripts outside these roots are not scanned.

Both runtimes contribute to the same catalog. Extraction preserves compatible translations, locale headers, and translator metadata. Removed messages become obsolete (`#~`); restored messages recover compatible saved translations. Changing a message between singular and plural, or changing its plural source text, clears incompatible translations for review.

## Marking copy

### Elixir and templates

Place `use Gettext` below the module's `@moduledoc`, when present:

```elixir
use Gettext, backend: OperatelyWeb.Gettext

gettext("Save")
gettext("Hello %{name}", name: name)
ngettext("1 task", "%{count} tasks", count)
pgettext("button", "Close")
```

Use the same calls in HEEx and EEx expressions. Translate email subjects as well as both body formats. For rich email content, use existing template helpers with catalog-owned placeholders and escaped user content, not raw translated HTML.

### React and TurboUI

In app components:

```tsx
import { useTranslation } from "react-i18next";
import { Link, Trans } from "turboui";
import { tn } from "@/i18n";

const { t } = useTranslation();

t("Save");
t("Hello {{name}}", { name });
t("Close", { context: "button" });
tn("1 task", "{{count}} tasks", count);
tn("1 task", "{{count}} tasks", count, { context: "inbox" });

<Trans
  i18nKey="Open <resource>{{name}}</resource>."
  values={{ name }}
  components={{ resource: <Link to={path} /> }}
/>;
```

Inside TurboUI, import `tn` from the relative `i18n` module and `Trans` from the relative `Translate` module (for example, `../i18n` and `../Translate`); do not import app modules. Outside React components, use `i18n.t("Save")` from the corresponding i18n module at render/call time, not once at module initialization. Keep message identifiers and both plural source forms as literal strings so extraction can find them.

Use Operately's shared `Trans` adapter rather than importing `Trans` directly from `react-i18next`. It subscribes to language changes and preserves literal user content through escaping. Put link text inside named tags, as above; avoid HTML void-element names such as `<link>`. Self-closing tags are suitable only for components that render their own content, such as `FormattedTime`.

## Copy-change workflow and verification

1. Read the target-language glossaries and wrap all new or changed system copy, including error branches and accessible text.
2. Run `make gen.i18n` to extract messages and merge catalogs.
3. Fill every active translation and required plural form in each supported non-English PO file. Preserve named placeholders, context, and rich-text tags. Review translations against the glossary.
4. Run `make gen.i18n` again and include the source, PO, POT, and generated-resource changes in the same PR. Inspect the diff for unintended translation changes.
5. Run `make test.i18n`. It checks that every wrapped source message has a translation in every supported non-English language, without changing your working tree.
6. Run the affected surface's tests and check English, translated output, user-content escaping, links, and zero/one/many counts where relevant. Check language switching and flag rollback when changing locale handling; email changes also verify recipient isolation and both body formats.

Existing focused catalog checks can be run from the repository root:

```bash
make test FILE=app/test/operately/i18n/catalog_test.exs
make test FILE=app/test/operately/i18n/converter_test.exs
make test FILE=app/test/operately/i18n/pt_br_translations_test.exs
```

`make test.i18n` checks current wrapped copy against every supported non-English PO catalog, including newly registered languages. CI fails for missing, blank, fuzzy, or incompatible singular/plural translations and identifies the language, message/context, location, and missing form. Obsolete entries and `intlRelativeDateTime` are excluded; translations identical to English are allowed.

To fix failures, run `make gen.i18n`, complete the reported PO entries, regenerate, and rerun `make test.i18n`. Commit POT, PO, and JSON changes together.

This checks completeness only. Unwrapped copy, generated-file freshness, language configuration, placeholders, tags, and translation quality still require review.

Runtime English fallback remains a safeguard, not permission to ship missing translations. Preserve fallback behavior and its tests. Plural conversion uses explicit locale mappings; for Portuguese, the frontend's `zero`, `many`, and `other` categories use `msgstr[1]`, while `one` uses `msgstr[0]`. The zero override prevents a zero count from displaying a hardcoded singular. Missing plural forms fall back using English plural rules.
