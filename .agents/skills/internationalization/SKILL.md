---
name: internationalization
description: Maintain Operately translations when adding or changing user-visible copy, fixing missing translations, or adding a supported language. Covers shared Gettext/i18next catalogs, glossaries, generation, and completeness checks; excludes translating user-authored content or general prose outside the product.
---

# Internationalization

## References

Read the reference for the current task before making changes. Keep detailed workflows in the linked guide and skill reference.

- **Copy changes or missing translations:** follow the [developer guide](../../../docs/internationalization.md) and its linked language glossaries.
- **Adding a language:** also read [Adding a language](references/adding-a-language.md). Follow its glossary-first sequence, registration checklist, commands, and review requirements.

## Essential rules

- Hardcoded system-authored, user-visible copy is forbidden. Use the existing translation wrappers and supply translations for every supported language.
- Edit PO files, regenerate catalogs/resources, and run `make test.i18n` plus focused tests. Never edit generated JSON. Completeness checks do not replace the review described in the guides.
- Preserve user content, machine identifiers, escaping, English defaults, and existing locale/feature-flag behavior. Keep changes within the requested scope.
- AI may draft translations but must not claim native-speaker approval. Reuse existing documented approval and report outstanding review honestly. Routine copy review is recommended **if possible**; new-language review follows the dedicated guide.
