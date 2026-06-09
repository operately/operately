# Help Docs Reference

This document expands on the rules in [SKILL.md](SKILL.md). Treat `SKILL.md` as
the mandatory short operating contract and use this file when you need templates,
file paths, research guidance, or annotated examples.

## Repository Paths

The help center lives in the **sibling website repository**, not in operately.

| What | Path |
| ---- | ---- |
| Website repo (sibling) | `../website/` |
| Help content | `website/src/content/docs/help/` |
| Sidebar config | `website/src/config/helpCenter.js` |
| Contributor guide | `website/docs/help-center/README.md` |
| AI drafting tips | `website/docs/help-center/ai-tips.md` |
| API docs (do not edit) | `website/src/content/docs/help/api/` |

Published help center: [operately.com/help](https://operately.com/help)

## App Research Map

Research the feature in the **operately** repo (this repo). Extract UI facts only.

### Where to look

| Area | Path | What you find |
| ---- | ---- | ------------- |
| Pages | `app/assets/js/pages/` | Route-level screens, page layout, navigation |
| Features | `app/assets/js/features/` | Feature-specific UI (activities, forms, modals) |
| Shared UI | `turboui/src/` | Reusable components (billing, tables, modals, pickers) |
| Page tests | `app/assets/js/pages/**/*.test.tsx` | Expected UI behavior and labels |
| Feature tests | `app/test/features/` | End-to-end user flows (for understanding, not copying) |

### What to extract from source

- Top navigation items, sidebar links, tab names
- Button labels, dropdown options, dialog titles
- Form field labels, placeholders, validation messages
- Step order in multi-step dialogs
- Permission dropdowns and access level names shown in the UI
- Empty state text, success toasts, error messages
- Multiple entry paths to the same action (e.g. from nav vs work map)

### What to ignore

- `app/lib/` — Elixir business logic, operations, schemas
- `app/lib/operately_web/api/` — API endpoints
- Database migrations and Ecto schemas
- Activity content handlers, serializers, notification logic

Use backend code only if you need to locate which page component renders a
feature — then switch to reading the frontend source.

### Research workflow

1. Search for the feature name in `app/assets/js/pages/` and `app/assets/js/features/`
2. Read the page and its child components for labels and flow order
3. Check `turboui/src/` if the page imports shared components
4. Compare findings with similar existing help pages for consistency
5. Note every UI label exactly as it appears in the source

## Doc Type Decision Guide

| Type | When to use | Structure |
| ---- | ----------- | --------- |
| How-to | User performs one specific task | Intro paragraph → `<Steps>` → optional follow-up section |
| Overview | Explain a product area or concept | Intro → `##` sections with bullets; screenshots optional |
| Reference | Permissions, settings, access matrices | Intro → tables or bullet lists → links to detail pages |

**One task per page.** If a feature has several distinct user actions, create
separate pages (e.g. `create-goal`, `close-goal`, `delete-goal`) rather than
one long page.

## File Layout and Naming

### Flat file (no local screenshots)

```
website/src/content/docs/help/create-goal.mdx
```

URL: `/help/create-goal`

### Folder with screenshots

```
website/src/content/docs/help/log-in/
├── index.mdx
└── log-in.png
```

URL: `/help/log-in`

### Naming rules

- Action verb first: `create-space`, `remove-space-member`
- Kebab-case with hyphens: `make-space-private`
- No articles: `create-space`, not `create-a-space`
- Descriptive and specific: `reassign-space-manager-to-member`, not `change-role`

## MDX Templates

### Minimal frontmatter

```yaml
---
title: "Create a goal"
description: "Learn how to create goals in Operately to track meaningful progress and outcomes."
---
```

Only `title` and `description` are needed. Do not add custom fields.

### Flat how-to (no screenshots)

```mdx
---
title: "Add tasks in Kanban"
description: "Add tasks directly from a Kanban column."
---

import { Steps } from '@astrojs/starlight/components';

You can add tasks directly from the Kanban board.

<Steps>
1. Find the column (status) where you want the task to start.
2. Click **Add new task** at the bottom of that column.
3. Enter the task name.
4. Click **Add** or press **Enter**.
</Steps>

The task will be created in that column (status).
```

### Flat how-to with ImageEnhancer (no local images yet)

Use when the page may get screenshots later, or when referencing `<ImageEnhancer />`
without co-located PNGs:

```mdx
---
title: "Create a goal"
description: "Learn how to create goals in Operately to track meaningful progress and outcomes."
---

import { Steps } from "@astrojs/starlight/components";
import ImageEnhancer from "@/components/ImageEnhancer.astro";

<ImageEnhancer />

Goals in Operately help you track meaningful progress toward specific outcomes.

## Creating a goal

<Steps>
1. Click the **+ New** button in the top navigation bar
2. Select **Goal** from the dropdown menu
3. Fill in the required information and click **Add Goal**
</Steps>
```

### Folder page with screenshots

```mdx
---
title: Log in
description: Learn how to log in to your Operately account and get back to your work quickly.
---

import ImageEnhancer from '@/components/ImageEnhancer.astro';
import { Steps } from '@astrojs/starlight/components';

<ImageEnhancer />

Logging in to Operately takes just a few seconds. Here's how to get back to your work quickly.

![Screenshot: Main login screen with Google and email options](./log-in.png)

<Steps>
1. Visit [app.operately.com/log_in](https://app.operately.com/log_in)
2. Choose your login method
3. Click **Continue** to access your account
</Steps>
```

Image alt text format: `Screenshot: {brief description of what is shown}`

### Reference page with table

```mdx
---
title: "How permissions work"
description: "Understand permission levels, inheritance, and effective access in spaces, goals, and projects."
---

import { Aside } from '@astrojs/starlight/components';

Operately permissions are built around five selectable access states:

- **No Access**
- **View Access**
- **Comment Access**
- **Edit Access**
- **Full Access**

## Permission levels

| Access Level       | What it means |
| ------------------ | ------------- |
| **No Access**      | The resource is hidden and cannot be accessed. |
| **View Access**    | Can open and read the resource and its content. |

See full details in [Space access control](/help/space-access-control).
```

### Sidebar entry in helpCenter.js

Add inside the appropriate section's `items` array:

```javascript
{ label: "Create a goal", link: "/help/create-goal" },
```

For folder-based pages, the link uses the folder name:

```javascript
{ label: "Log in", link: "/help/log-in" },
```

## Sidebar Sections

Every new page must be registered in
`website/src/config/helpCenter.js`. Pick the section that best fits
the feature. The **API docs** section is autogenerated — do not add manual
entries there.

| Section | Typical content |
| ------- | --------------- |
| Meet Operately | Introduction, features overview, quick tour |
| Account management | Sign up, log in, profile, password, appearance |
| Global Search | Search feature |
| User profiles | Tasks, assigned work, activity, relationships |
| Work maps | Work map views and hierarchy |
| Permissions & Access | Permission overviews and access control |
| Goal tracking | Goal CRUD, targets, check-ins, permissions |
| Project management | Project CRUD, milestones, tasks, contributors |
| Spaces | Space creation, members, access, tools |
| Kanban board | Kanban views and task management |
| Discussions | Posts, replies, reactions, drafts |
| Documents & Files | Documents, files, folders, exports |
| Review | Champion/reviewer due actions |
| People | Company members, org chart, profiles |
| Company administration | Org settings, invites, admins, owners, import/export |
| Notifications | Email and notification settings |
| Self-hosted installations | Installation, updates, email, sign-in |
| CLI | CLI overview, install, auth, usage |
| API docs | **Autogenerated — do not edit manually** |

## Annotated Examples

Study these existing pages before writing new docs.

### How-to with multiple entry paths

File: `website/src/content/docs/help/create-goal.mdx`

Why this pattern:

- Intro explains the concept (goals vs tasks) before steps
- Multiple `###` subsections for different ways to reach the same action
- Each path uses its own `<Steps>` block
- "What you need to provide" section documents form fields
- Cross-links to permission docs inline
- "Building out your goal" covers post-creation next steps

### Simple flat how-to

File: `website/src/content/docs/help/kanban-board-add-task.mdx`

Why this pattern:

- Short intro, single `<Steps>` block, one-sentence outcome
- No screenshots needed for a straightforward action
- Flat `.mdx` at help root

### Overview with screenshots

File: `website/src/content/docs/help/quick-tour/index.mdx`

Why this pattern:

- Folder layout with co-located PNGs
- `##` sections per major screen
- Screenshot followed by bullet list explaining each area
- "Why it matters" callouts for context

### Reference with permission table

File: `website/src/content/docs/help/permissions-overview.mdx`

Why this pattern:

- Opens with bullet list of access levels (no duplicate H1)
- Markdown table for the permission matrix
- Separate sections per resource type (spaces, goals, projects)
- Links to detailed pages for each resource

### Screenshot folder page

File: `website/src/content/docs/help/log-in/index.mdx`

Why this pattern:

- `{slug}/index.mdx` with local PNG
- `<ImageEnhancer />` at top for lightbox behavior
- Screenshot alt text describes what is shown
- `<Steps>` for the email login sub-flow

## API Documentation

The `website/src/content/docs/help/api/` directory is **fully auto-generated**.
Agents must never create, edit, or delete MDX files there. Those files are
overwritten on every sync.

When API docs need to change, work in **this repo (operately)** at the generator
or API definition level. Commit those changes — CI publishes updated docs to the
website on the next deploy. **Do not run the generation command manually** and
do not copy output into the website repo yourself; that is CI's job.

### How generation and publishing work

1. `Operately.ApiDocs.Generator` introspects `OperatelyWeb.Api.External`
   (`__queries__`, `__mutations__`, `__types__`, `__namespace_descriptions__`)
2. It writes MDX under `tmp/generated/api-docs/help/api/` — one file per
   endpoint, plus namespace indexes and a root index
3. On deploy, CI runs `scripts/sync_api_docs_to_website.sh`, which calls
   `make gen.api.docs.ci` and rsyncs the output into the website repo
4. A bot commits: `docs: sync API docs from operately@{sha}`

The Mix task (`mix operately.gen.api.docs`) and Makefile target
(`make gen.api.docs`) exist for local inspection and tests. **Agents should not
run them** as part of doc work — making the source changes and merging is
enough; the next deploy updates the live help center.

**Sidebar:** The API docs section uses Starlight autogeneration — no manual
`helpCenter.js` entries needed for individual endpoints:

```javascript
{
  label: "API docs",
  autogenerate: { directory: "help/api" },
}
```

### What drives each part of a generated page

Each endpoint page (e.g. `api/tasks/create.mdx`) is built from API metadata,
not hand-written prose:

| Page section | Source |
| ------------ | ------ |
| Title and description | Derived from namespace + endpoint name in `Operately.ApiDocs.Markdown` |
| Endpoint table (method, path, handler) | Query/mutation registration in `app/lib/operately_web/api.ex` |
| Inputs table | `inputs do` block on the handler module |
| Outputs table | `outputs do` block on the handler module |
| Authentication notes | `Operately.ApiDocs.Markdown` (query vs mutation rules) |
| cURL example | `Operately.ApiDocs.CurlExample` |
| Response example JSON | `Operately.ApiDocs.ResponseExample` |
| Type formatting in tables | `Operately.ApiDocs.TypeFormatter` |
| Namespace index intro | `@doc` on the `namespace(:…)` block in `api.ex` |

Handler `@moduledoc` strings are extracted into the catalog JSON but are **not**
currently rendered on MDX endpoint pages. To add per-endpoint descriptions to
the published docs, extend `Operately.ApiDocs.Markdown.endpoint_page/2`.

### Where to make changes

**Generator and formatting** (affects all or many API doc pages):

| File | Change when |
| ---- | ----------- |
| `app/lib/operately/api_docs/generator.ex` | Output structure, file layout, catalog building |
| `app/lib/operately/api_docs/markdown.ex` | Page templates, intro text, table layout, titles |
| `app/lib/operately/api_docs/type_formatter.ex` | How types appear in input/output tables |
| `app/lib/operately/api_docs/curl_example.ex` | cURL command format |
| `app/lib/operately/api_docs/response_example.ex` | Sample JSON responses |
| `app/lib/operately/api_docs/catalog.ex` | CLI catalog JSON alongside docs |

Changes to `markdown.ex` or shared formatters will likely affect **every** API
doc page. Review generated output broadly, not just one endpoint.

**New or updated endpoints** (adds or updates specific pages):

1. Register the endpoint in `app/lib/operately_web/api.ex` inside the appropriate
   `namespace(:…)` block via `query/3` or `mutation/3`
2. Implement the handler module under `app/lib/operately_web/api/` with
   `inputs do`, `outputs do`, and permission logic
3. Set the namespace description with `@doc` immediately before `namespace(:goals)`
   (or whichever namespace) — this text appears on the namespace index page
4. To exclude an endpoint from the public catalog, pass `catalog: false` in the
   query/mutation opts (see `Operately.ApiDocs.Generator.build_endpoint/5`)

External API surface is defined by `OperatelyWeb.Api.external_endpoints/0` in
`app/lib/operately_web/api/external.ex`, which currently mirrors
`common_endpoints/0`.

**Tests:** `app/test/mix/tasks/operately.gen.api.docs_test.exs` verifies generation
output. Update it if generation behavior changes.

### Agent workflow for API doc changes

1. Confirm the request is about the **API reference** (`/help/api/`), not a
   product how-to page
2. Identify whether the change is global (generator/formatting) or
   endpoint-specific (handler registration or inputs/outputs)
3. Make changes only in the operately repo paths listed above
4. Do **not** edit `website/src/content/docs/help/api/`
5. Do **not** run `make gen.api.docs` or copy files to the website repo
6. Tell the user that CI will sync the updated docs on the next deploy

For user-facing API **usage guides** (when to use tokens, how to get started),
write a product help page under `website/src/content/docs/help/` (e.g. near the
existing `create-api-token` page) — not hand-written endpoint reference pages.

## Screenshot Guidelines

When adding screenshots (typically done by a human contributor after the agent
drafts the text):

1. Use demo organization **Nexus Dynamics**
2. Set profile name to **John Cooper**
3. Window size **1280×1100** (Window Resizer Chrome extension)
4. Capture with Cleanshot X; press **⌘E** for edit screen
5. Background: gradient (purple/pink, second option), padding 50, corners 2
6. Add background to full-page screenshots; skip background for element crops
7. Save PNGs co-located with `{slug}/index.mdx`

## Updating Existing Docs

When editing an existing help page:

1. Read the current page and its sidebar entry
2. Re-research the app if the feature may have changed
3. Match the existing page's structure unless the feature warrants a rework
4. Do not rename files or change URLs without explicit user request (breaks links)
5. Update `helpCenter.js` only if the label or section needs to change

## Common Mistakes to Avoid

- Documenting API endpoints or Elixir modules instead of UI steps
- Editing generated files under `website/src/content/docs/help/api/`
- Running `make gen.api.docs` manually or copying generated MDX into the website repo (CI handles publishing)
- Changing `markdown.ex` or other generator code without expecting all API pages to change
- Forgetting to add the sidebar entry in `helpCenter.js`
- Starting the page body with an H1 or a heading before the intro paragraph
- Adding a "Related pages" section at the bottom
- Using paraphrased UI labels instead of the exact text from the app source
- Creating one mega-page that covers many unrelated tasks
- Writing developer-facing content (setup, architecture, code examples)
