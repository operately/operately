---
name: components-architecture
description: >-
  Defines where UI components belong in Operately (TurboUI-first). Use when
  creating, changing, or migrating UI components, adding features that need UI,
  or deciding whether to refactor legacy app UI in app/assets/js/components or
  app/assets/js/features. Covers pure TurboUI components, the app bridge
  pattern, and legacy migration scenarios.
---

# Components Architecture

All UI components belong in TurboUI as pure components. The app bridges the
backend and TurboUI: it loads data, calls APIs, reads app contexts, and passes
data and callbacks as props.

TurboUI was introduced after much of the app UI was built. `app/assets/js/components/`
and UI components under `app/assets/js/features/` are **deprecated for new UI**.
Non-UI code in `app/assets/js/features/` (activity registration, API hooks,
loaders, model hooks) still belongs in the app.

For detailed examples, see [reference.md](reference.md).

## Architecture

Data flows **down** as props; user actions flow **up** as callbacks. The app
sits in the middle and talks to both sides.

| Layer | Location | Responsibility |
| ----- | -------- | -------------- |
| UI | `turboui/src/` | Render UI; no API, routing, or app contexts |
| Bridge | `app/assets/js/pages/` | Load data, call APIs, read contexts, build props, handle callbacks |
| Backend | Elixir/GraphQL | Persist and serve data |

## Pure Components

TurboUI components must **not**:

- Import from `@/…` app paths
- Call `Api.*`, use React Router hooks, or read app contexts (`TimezoneContext`, `useMe`, etc.)
- Fetch data or perform server-side side effects

TurboUI components **should**:

- Accept display data and user preferences via props
- Use callbacks for actions (`onSave`, `onDelete`, `onTaskUpdate`)
- Keep local UI state only (open/closed, draft input) and notify the parent via callbacks
- Export from `turboui/src/index.tsx`
- Include Storybook stories
- Type props with `turboui/src/ApiTypes` (same shapes as `app/assets/js/api/index.tsx`) or a
  component-specific type when the UI needs a different shape

### Data types

`turboui/src/ApiTypes/index.ts` mirrors the types in `app/assets/js/api/index.tsx`.
TurboUI components should expect those API shapes — the app fetches data via
`Api.*` and passes it through with minimal mapping.

- **Default**: props use `ApiTypes` directly (e.g. `Project`, `Person`, `Task`)
- **Custom prop type**: when the UI needs a view-specific shape, define it in
  the component's `types.ts` — re-export from `ApiTypes` where possible (see
  `turboui/src/ResourceHub/types.ts`)
- **Transform in TurboUI**: when display logic applies to API data, do it inside
  the TurboUI component rather than in the app bridge

Do **not** add new `parse*ForTurboUi` or `prepare*` helpers in the app for new
work. Legacy parsers still exist in older pages but are not the target pattern.

### Component design

- **Self-contained**: manage UI state locally; notify parents via callbacks
- **Generic callbacks**: prefer `onTaskUpdate(id, updates)` over many specific handlers (`onAssigneeChange`, `onDueDateChange`, …)
- **Callback shape**: `(id: string, updates: Partial<Type>) => void` for entity updates
- **No mock data in components**: mock data belongs in Storybook stories only
- **Reuse TurboUI primitives**: `PrimaryButton`, design-system colors (`content-subtle`, `content-error`), Tabler icons — check `turboui/src/Colors/Colors.stories.tsx` and `turboui/src/icons/index.tsx` before adding new ones

### File organization

```
turboui/src/ComponentName/
├── index.tsx           # Main component (+ exported Props type)
├── index.stories.tsx   # Storybook stories
├── mockData.ts         # Mock data for stories (optional)
└── types.ts            # Component-specific types (optional)
```

### Storybook workflow

1. Develop and test components in Storybook (`make turboui.storybook`)
2. Create stories for empty, loading, error, and interactive states
3. Before committing: `make turboui.build && make turboui.test`

## App Bridge

App pages own all backend interaction. Typical page layout:

```
app/assets/js/pages/SomePage/
├── index.tsx      # Page module (loader + Page export)
├── loader.tsx     # Data fetching
├── navigation.tsx # Breadcrumbs / nav props (optional)
└── page.tsx       # Build props, render TurboUI component
```

**Thin bridge** — loader fetches data, page passes it through:

- `app/assets/js/pages/ReviewPage/index.tsx`
- `app/assets/js/pages/ResourceHubDraftsPage/page.tsx`

**Standard bridge** — props object + model hooks for mutations:

- `app/assets/js/pages/ResourceHubPage/page.tsx`
- `app/assets/js/pages/SpaceWorkMapPage/page.tsx`

**Complex bridge** — field state, API updates, large typed props:

- `app/assets/js/pages/ProjectPage/index.tsx`
- `app/assets/js/pages/MilestonePage/index.tsx`
- `app/assets/js/pages/GoalPage/index.tsx`

App-side concerns that stay in the app (not TurboUI):

- Data fetching: loaders, `Api.*`, model hooks
- Mutations: wire callbacks to `Api.*` (often via `usePageField`)
- Routing: `usePaths()` — pass link strings or path-builder callbacks as props
- App contexts: locale, timezone, current user — pass as props

Matching TurboUI components to study:

- `turboui/src/ResourceHubPage/` — page component with stories and `mockData.ts`
- `turboui/src/ProjectPage/`, `turboui/src/MilestonePage/`, `turboui/src/WorkMapPage/`

## Scenario 1: New UI Components

**Always** create in `turboui/src/ComponentName/`. Do **not** add new UI to
`app/assets/js/components/` or `app/assets/js/features/`.

App work for a new feature:

1. Add or adjust a page in `app/assets/js/pages/` (loader, navigation if needed)
2. Fetch data in the loader; pass API-shaped data to TurboUI (typed via `ApiTypes`)
3. Wire callbacks to `Api.*` / model hooks
4. Render the TurboUI component

## Scenario 2: Feature Needs an Existing App UI Component

First, `grep` imports to find call sites of the existing component.

### 2a — Few usages (small refactor)

Use when updating every call site is a small, reviewable change.

1. Migrate the component to TurboUI as a pure component
2. Adjust props to remove app dependencies (pass locale, timezone, etc. from app)
3. Update **all** existing call sites to import from `turboui`
4. Remove or thin the app copy
5. Use the TurboUI component in the new feature

### 2b — Many usages (large refactor)

Use when a full migration would dominate the PR or touch unrelated features.

1. Create a **new pure version** in TurboUI that is **visually identical** to the legacy component
2. Use it **only in the new feature** for now
3. Do **not** refactor all existing call sites in the same PR
4. Leave the legacy app component in place until a dedicated migration

## Checklist

- [ ] New or changed UI lives in `turboui/src/`, not in deprecated app UI folders
- [ ] TurboUI component has no app imports or API calls
- [ ] App page passes data and callbacks; API and context logic stays in app
- [ ] Component exported from `turboui/src/index.tsx`
- [ ] Storybook story added or updated (`make turboui.build && make turboui.test`)
- [ ] Props typed with `ApiTypes` or a documented component-specific type — no new app-side parsers
- [ ] Legacy migration uses the correct scenario (2a full migration vs 2b new-feature-only)
