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

Extraction unions Elixir and frontend messages. Re-running extract does not drop the other runtime's strings or overwrite reviewed PO translations.

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
<Trans i18nKey="Click <link>here</link> to continue" components={{ link: <a href="/help" /> }} />;
```

Named placeholders, context, plurals, and rich-text tags are preserved when converting Gettext catalogs to i18next JSON. Locale directories use Gettext names (`pt_BR`); generated JSON uses BCP 47 (`pt-BR`). Missing translations fall back to English.
