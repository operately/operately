# Compact activity feed verification

Grouped task and milestone updates initially show three distinct renderable
entries. The inline control shows the remaining count, expands locally, and
collapses without replacing the focused button. Resource links retain their
destinations; deletion records use literal names and activity identity.

The original five task groups retain their extraction and location rules.
Additional groups require compatible locations, movement origins/destinations,
milestone transitions, archive states, or milestone operations. Only bodyless
milestone completions and reopenings group; written explanations remain
standalone with their summaries. Milestone rename and date details remain
associated with their resource, including repeated chronological changes.

## UI primitives

- `ActivityResourceList`: pure TurboUI preview, normalization, and local state.
- `Link`: valid resource and location destinations.
- `ActionLink`: native keyboard-operable expansion button with `aria-expanded`.
- `Trans`: translated activity sentences and literal resource names.
- `DateField`: existing read-only milestone date details.

No new raw interactive controls were added to production components. App
wrappers resolve activity content, paths, and the effective locale. The preview
makes no backend request.

## Browser verification

`ActivityResourceList/preview.browser.test.ts` exercises 1280px and 375px widths
in both themes. It verifies three initial links, thirty expanded links,
keyboard Enter/Space activation, focus preservation, `aria-expanded`, literal
punctuation/markup-like names, and no horizontal overflow. It switches the
effective locale from English to Brazilian Portuguese while expanded, checks
that expansion survives, then checks translated remaining counts and list
punctuation after collapsing.

Translations are supplied in every supported-language PO catalog and generated
resources. Focused app tests cover extraction, grouping compatibility, all
affected handlers, date/name detail association, ordinary comment summaries,
human/agent actions, feed contexts, and pagination extending an expanded group.
