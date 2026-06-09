---
name: help-docs
description: >-
  Write and update end-user product help documentation for Operately. Use when
  the user asks to write help documentation, document a feature, update a help
  page, create user docs, or add content to the help center at operately.com/help.
  Also apply when documenting how users accomplish tasks in the web app, writing
  product documentation, or updating operately-website help pages.
---

# Help Docs

Write help documentation for **end users** of Operately — people using the web
app to run their organization. These docs live in the sibling website repository,
not in this repo.

This is product documentation, not developer documentation. Document what users
see and do in the UI. Do not document backend implementation, database schema,
GraphQL, Elixir modules, or API handler details.

**Never edit** anything under `operately-website/src/content/docs/help/api/`.
The API reference is auto-generated from this repo and synced to the website
by CI on deploy. If API docs need to change, modify the generator or the API
definitions in this repo — not the generated MDX files. See
[reference.md — API documentation](reference.md#api-documentation) for how that
works.

For templates, file paths, research map, and annotated examples, read
[reference.md](reference.md). For user-facing wording, apply the
[ui-copy](../ui-copy/SKILL.md) skill.

## Scope

**In scope:**

- Step-by-step how-to guides for tasks users perform in the app
- Feature overviews that explain screens, concepts, and workflows
- Reference pages for permissions, settings, and access levels
- CLI usage docs (same end-user tone; no API internals)

**Out of scope:**

- Backend code, API endpoints, GraphQL schemas, database details
- Files under `help/api/` in the website repo
- Developer setup, architecture, or contribution guides
- "Related pages" sections at the bottom of help pages

## Workflow

### 1. Clarify the doc task

Identify what the user wants documented. Each page should cover **one task or
one concept**. Choose the doc type:

- **How-to** — a single user action (e.g. "Create a goal", "Add a task")
- **Overview** — explain an area of the product (e.g. "Introduction to Spaces")
- **Reference** — permission levels, settings matrices, or access rules

If the request spans multiple tasks, plan separate pages or confirm scope with
the user.

### 2. Find similar existing docs

Search `operately-website/src/content/docs/help/` for pages on the same feature
or a closely related task. Mirror their structure, tone, and level of detail.

Read the contributor guides when in doubt:

- `operately-website/docs/help-center/README.md`
- `operately-website/docs/help-center/ai-tips.md`

### 3. Research the feature in the app

Investigate how the feature works **from the UI only**. Use exact labels,
button text, and menu names from the source code.

**Where to look:**

- `app/assets/js/pages/` — page-level UI and navigation
- `app/assets/js/features/` — feature-specific components and flows
- `turboui/src/` — shared UI components (billing, forms, modals, etc.)

**What to extract:**

- Navigation paths (menus, tabs, links the user clicks)
- Button and menu labels, form field names, dialog titles
- Step order in modals and wizards
- Permission controls visible in the UI
- Empty states, success messages, and error text

**What to ignore:**

- `app/lib/` Elixir modules, operations, and business logic
- API endpoints, schemas, and serializers
- Database migrations and data models

Feature tests (`app/test/features/`, `*.spec.ts`) can clarify user-visible
flows but are not doc content themselves.

For permission-related features, read existing help pages like
`permissions-overview.mdx` and the permission UI in the app — not backend
enforcement code.

### 4. Choose file layout

All docs go in `operately-website/src/content/docs/help/`.

| Layout | When to use | Path pattern |
| ------ | ----------- | ------------ |
| Flat file | No co-located screenshots | `{slug}.mdx` |
| Folder | Page includes local PNG screenshots | `{slug}/index.mdx` + `{slug}/*.png` |

**Naming:** action-verb-first kebab-case — `create-goal`, `remove-space-member`.
No articles (`create-space`, not `create-a-space`).

### 5. Draft the page

Start with frontmatter (`title` and `description` only), then a short intro
paragraph. Do not add an H1 — Starlight renders the title from frontmatter. Do
not start the body with another heading.

**Structure by doc type:**

- **How-to:** intro → `<Steps>` for the procedure → optional "what happens next"
- **Overview:** intro → sections with bullets; screenshots optional
- **Reference:** intro → tables or bullet lists → links to detail pages

**Formatting:**

- Import and use `<Steps>` from `@astrojs/starlight/components` for procedures
- Import `<Aside>` for tips and notes when needed
- Import `<ImageEnhancer />` from `@/components/ImageEnhancer.astro` when the
  page uses screenshots (place `<ImageEnhancer />` near the top)
- **Bold** all UI element names: `Click the **+ New** button`
- Cross-link related help pages inline: `[Goal permissions](/help/set-goal-privacy)`

**Writing tone:**

- Simple, conversational, concise
- One task per page; short sentences and paragraphs
- No corporate speak, jargon, or buzzwords
- Focus on practical steps and outcomes

### 6. Register in sidebar

Every new page **must** be added to
`operately-website/src/config/helpCenter.js` under the correct section group.
Add a `{ label, link }` entry where `link` is `/help/{slug}`.

See [reference.md](reference.md) for the list of sidebar sections.

### 7. Apply ui-copy standards

Match the product vocabulary from the UI source. Use specific action verbs on
buttons and links. Keep copy honest and concrete. See the
[ui-copy](../ui-copy/SKILL.md) skill for full principles.

### 8. Run the review checklist

Before finishing, verify every item in the checklist below.

## Screenshots

If screenshots are not available, write the doc as a flat `.mdx` without
images. That is acceptable — note for the human contributor that screenshots
can be added later.

When screenshots are available (provided by the user or captured via browser):

- Use the folder layout: `{slug}/index.mdx` with co-located PNGs
- Include `<ImageEnhancer />` at the top of the page
- Follow the contributor guide: demo org "Nexus Dynamics", profile name "John
  Cooper", window size 1280×1100, CleanShot X background settings

Do not add background to element-level screenshots; add background to full-page
screenshots only.

## Definition of Done

A help doc task is done only when:

- [ ] The page reflects actual UI labels and flows verified in app source
- [ ] No backend, API, or implementation details appear in the content
- [ ] The file uses the correct path, naming convention, and layout (flat vs folder)
- [ ] Frontmatter has `title` and `description`; body starts with an intro paragraph
- [ ] UI element names are **bold**; procedures use `<Steps>` where appropriate
- [ ] Related help pages are cross-linked inline; no "Related pages" footer
- [ ] A sidebar entry was added in `helpCenter.js` under the correct section
- [ ] Tone and structure match nearby existing docs; ui-copy principles applied
- [ ] Nothing under `help/api/` in the website repo was modified by hand
- [ ] If API docs were in scope, changes were made in the operately generator or API handlers only (CI publishes them on deploy)
