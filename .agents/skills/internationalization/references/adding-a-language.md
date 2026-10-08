# Adding a language

Add a language's registration, complete translations, and generated resources in one PR. Keep English as the default and preserve the existing language feature flag and fallback behavior. This guide complements the [internationalization guide](../../../../docs/internationalization.md).

## 1. Prepare the glossary

Copy [the template](../../../../docs/i18n/glossaries/template.md) to `docs/i18n/glossaries/<BCP-47-locale>.md`. Fill every target term, its meaning, capitalization, and usage guidance. Add as many terms, phrases, and examples as the language needs; glossaries need not have identical entries.

Choose the language/region and both locale codes, for example `de` for German or `pt-BR` / `pt_BR` for Brazilian Portuguese. AI may draft terminology. Resolve ambiguous roles and borrowed terms, and link the glossary from the main guide. Native-speaker review is recommended when available, but is not required before full-catalog translation. Review status, reviewer names, and approval references are optional.

## 2. Register the language

Update these locations together; adding a PO directory alone does not enable a language:

| Location | Change |
| --- | --- |
| [Backend registry](../../../../app/lib/operately/i18n/languages.ex) | Add the BCP 47 code to `@supported`. Person validation and the API language enum derive from this list. |
| [Gettext configuration](../../../../app/config/config.exs) | Add the Gettext code to `OperatelyWeb.Gettext`'s `allowed_locales`. |
| [Locale mapping](../../../../app/lib/operately/i18n/locale.ex) | Verify both code conversions and add an explicit i18next-category → Gettext-index plural mapping. |
| [Frontend registry](../../../../app/assets/js/i18n/languages.ts) | Update both `SUPPORTED_LANGUAGES` and `isSupportedLanguage`; the guard currently lists languages explicitly. |
| [Frontend resources](../../../../app/assets/js/i18n.ts) | Import the generated JSON, include `FORMAT_MESSAGES`, and register the bundle in both initialization and the already-initialized branch. Generate the file in step 3. |
| [Profile selector](../../../../turboui/src/ProfileEditPage/index.tsx) | Extend `ProfileEditPage.Language` and `LANGUAGE_OPTIONS`, using the language's own name and a stable test ID. |
| [API types](../../../../app/lib/operately_web/api/types.ex) | The `:language` enum uses `Languages.api_values()`. Regenerate app and TurboUI types; do not hand-edit generated unions. |
| [Test catalog helper](../../../../app/assets/js/__tests__/i18n.ts) | Include the new bundle when saving/restoring resources between tests that substitute translations. |

Search for assumptions tied to existing languages, including tests and third-party widgets. The current locale helper handles language and optional region tags; script/variant tags may need an explicit extension and tests. Do not assume all tags or plural systems work merely because a registry entry exists.

Preserve explicit selection, English for unsupported/absent preferences, company-flag rollback, and account-membership resolution. Reuse [EffectiveLanguage](../../../../app/lib/operately/i18n/effective_language.ex) and [AccountLanguage](../../../../app/lib/operately/i18n/account_language.ex); do not add browser detection or independent locale state. Keep regional formatting and timezone preferences separate.

## 3. Create and translate the catalog

Run these commands from the repository root with the development environment available. The example creates German; replace `de` with the target **Gettext** code:

```bash
make gen.i18n
./devenv bash -c 'cd app && mix gettext.merge priv/gettext --locale de --no-fuzzy'
```

The merge creates `app/priv/gettext/de/LC_MESSAGES/messages.po`. `make gen.i18n` merges existing PO files but does not create new language directories. Use the shared extraction command above, not plain `mix gettext.extract`, so frontend messages stay included.

Verify the PO `Language` and `Plural-Forms` headers for the target language. Gettext uses numbered `msgstr[n]` forms; i18next uses named categories. The mapping in `Locale` must agree with the PO rules. Add every required form: the shared PO writer initially creates indexes 0 and 1 for new plural entries, so languages with other counts need their forms adjusted. Do not copy Portuguese rules. Test zero, one, many, and language-specific boundaries/fractions, including any necessary i18next `zero` override.

Translate every active message/context and required plural form using the glossary. AI may draft the entire catalog. Preserve `%{name}` placeholders, catalog-owned tags, and user content; do not edit English message identifiers or use English fallback to fill gaps. Resolve fuzzy entries before removing their flag. `intlRelativeDateTime` is the documented technical exception. Existing languages' translations must remain intact.

Regenerate resources and API/CLI types:

```bash
make gen.i18n
make gen
make gen.cli.catalog
make test.cli.catalog.sync
```

`make gen` updates the app API clients and `turboui/src/ApiTypes/index.ts`. Audit web, MCP, and external API consumers of the language enum; inspect generated CLI flags and document any unaffected surfaces. No separate English PO is needed, and generated JSON is never edited manually.

## 4. Review and verify

Review the new language's full catalog, especially glossary consistency and ambiguous contexts, and resolve identified issues before release. Native-speaker review is recommended when available for both new languages and routine copy changes, but is optional. Its absence, or missing approval metadata, must not block translation, merge, or release and is not itself a review finding. If native-speaker review occurs, its outcome may be recorded in the PR; do not claim review that did not occur.

Run the completeness check and type checks:

```bash
make test.i18n
make test.tsc.lint
make test.tsc.lint.turboui
```

`make test.i18n` automatically checks newly registered languages. It checks original PO completeness, not generated-file freshness, configuration, placeholders/tags, unwrapped copy, or linguistic quality. Regenerate again and confirm the catalogs/resources have no further changes.

Extend and run focused tests for the new language. Starting points:

```bash
make test FILE=app/test/operately/i18n/languages_test.exs
make test FILE=app/test/operately/i18n/effective_language_test.exs
make test FILE=app/test/operately/i18n/account_language_test.exs
make test FILE=app/test/operately/i18n/converter_test.exs
make test FILE=assets/js/i18n/languages.test.ts
./devenv bash -c 'cd turboui && npm test -- --runInBand src/ProfileEditPage/index.test.tsx'
```

Verify selection persists, switching updates the UI, flag-off restores English without deleting the preference, and fallback remains functional. Check account conflicts, route errors, escaping/link destinations, and plural boundaries. Exercise immediate, buffered, digest, and billing emails with mixed-language recipients in HTML and plain text. Review representative workflows at narrow widths with longer translations; right-to-left languages also need directionality and interaction checks before release.

## 5. Deliver together

Include the glossary, registration changes, complete PO/POT/JSON resources, generated API/CLI updates, tests, and verification results in the PR. Keep existing users in English until they select the language. Do not expose an incomplete language or weaken completeness checks to make it pass.
