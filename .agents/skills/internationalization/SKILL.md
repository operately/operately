---
name: internationalization
description: Maintain Operately translations when adding or changing user-visible copy, fixing missing translations, or adding a supported language. Covers shared Gettext/i18next catalogs, glossaries, generation, and completeness checks; excludes translating user-authored content or general prose outside the product.
---

# Internationalization

## References

Read the reference for the current task before making changes. Keep detailed workflows in the linked guide and skill reference.

- **Copy changes or missing translations:** follow the [developer guide](../../../docs/internationalization.md) and its linked language glossaries.
- **Adding a language:** also read [Adding a language](references/adding-a-language.md). Follow its glossary-first sequence, registration checklist, commands, and verification steps.

## Essential rules

- Hardcoded system-authored, user-visible copy is forbidden. Use the existing translation wrappers and supply translations for every supported language.
- Edit PO files, regenerate catalogs/resources, and run `make test.i18n` plus focused tests. Never edit generated JSON. Completeness checks do not replace the review described in the guides.
- Preserve user content, machine identifiers, escaping, English defaults, and existing locale/feature-flag behavior. Keep changes within the requested scope.
- Native-speaker review is recommended when available for glossaries, new languages, and routine copy changes. It is optional: do not block translation, merge, or release, or raise review findings solely because native-speaker approval or review metadata is absent. AI may draft terminology and translations; only claim native-speaker review when it actually occurred.
