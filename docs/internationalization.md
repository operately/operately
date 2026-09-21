# Internationalization

Operately keeps one Gettext catalog as the source of truth for Elixir, React, and TurboUI copy. English source text is the message identifier. Brazilian Portuguese is the first additional language, but this catalog infrastructure always runs in English until language selection is enabled.

User-authored content, API field names, and CLI command names are not translated.

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

Plural conversion maps i18next categories to Gettext translation indexes explicitly. For Brazilian Portuguese, both `_many` (whole millions) and `_other` use `msgstr[1]`.
