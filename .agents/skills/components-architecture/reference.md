# Components Architecture Reference

Expands on [SKILL.md](SKILL.md). Read this when implementing a new component,
building an app bridge page, or migrating legacy UI.

## App Bridge Examples

### Thin bridge — read-only data pass-through

`app/assets/js/pages/ReviewPage/index.tsx` — loader fetches assignments, page
renders TurboUI with no mutations:

```tsx
function Page() {
  const data = Pages.useLoadedData() as LoaderResult;
  return (
    <ReviewPage
      dueSoon={data.dueSoon}
      needsReview={data.needsReview}
      upcoming={data.upcoming}
    />
  );
}
```

`app/assets/js/pages/ResourceHubDraftsPage/page.tsx` — props object with
navigation built from `usePaths()`:

```tsx
const props: ResourceHubDraftsPage.Props = {
  title: ["Drafts", resourceHub.name ?? "Resource Hub"],
  navigation: buildDraftsPageNavigation(resourceHub, paths),
  nodes: draftNodes,
  getNodePath: (node) => getNodePath(paths, node),
};
return <ResourceHubDraftsPage {...props} />;
```

### Standard bridge — props object + model hooks

`app/assets/js/pages/ResourceHubPage/page.tsx` — wires model hooks and passes
callbacks for create/upload actions:

```tsx
const [createFolder] = folders.useCreate();
const nodesListProps = useResourceHubNodesListProps({ resourceHub, type: "resource_hub", nodes, refetch: refresh });

const props: ResourceHubPage.Props = {
  title: resourceHub.name || "Resource Hub",
  navigation: buildResourceHubPageNavigation(resourceHub, paths),
  resourceHub,
  nodesListProps,
  addFolderModalProps: {
    resourceHubId: resourceHub.id!,
    onCreated: refresh,
    onCreateFolder: async (args) => {
      await createFolder({ resourceHubId: args.resourceHubId, folderId: args.folderId, name: args.name });
    },
  },
  // ...
};
return <ResourceHubPage {...props} />;
```

`app/assets/js/pages/SpaceWorkMapPage/page.tsx` — passes fetched data and
mutation callbacks (older pages may still use legacy transform helpers):

```tsx
const [items, addItem] = useWorkMapItems(workMap);
return (
  <WorkMapPage
    items={items}
    addItem={addItem}
    spaceSearch={spaceSearch}
    navigation={[{ to: paths.spacePath(space.id), label: space.name }]}
    addItemDefaultSpace={{ id: space.id, name: space.name, link: paths.spacePath(space.id) }}
  />
);
```

### Complex bridge — editable fields + API updates

`app/assets/js/pages/ProjectPage/index.tsx` — loader fetches API data, page
wires field state and mutations via `usePageField`:

```tsx
const { project, checkIns } = data;

const [projectName, setProjectName] = usePageField({
  value: (data) => data.project.name!,
  update: (v) => Api.projects.updateName({ projectId: project.id, name: v }).then(() => true),
  onError: (e: string) => showErrorToast(e, "Reverted the project name to its previous value."),
});

const props: ProjectPage.Props = {
  project: { ...project, name: projectName },
  checkIns,
  onTaskCreate: createTask,
  onMilestoneUpdate: updateMilestone,
  newCheckInLink: paths.projectCheckInNewPath(project.id),
  // ...
};
return <ProjectPage key={project.id!} {...props} />;
```

`app/assets/js/pages/MilestonePage/index.tsx` and `app/assets/js/pages/GoalPage/index.tsx`
follow the same pattern: loader returns API-shaped data, many `usePageField` hooks
for editable fields, `Api.*` in update functions, and a large typed `Props` object.

## Data Types

TurboUI components type their props against `turboui/src/ApiTypes/index.ts`,
which matches the types in `app/assets/js/api/index.tsx`. The app bridge
fetches data via `Api.*` and passes it through; it should not add new mapping
layers unless unavoidable.

**Preferred — use ApiTypes directly in props:**

```tsx
import type { Project, ProjectCheckIn } from "turboui/src/ApiTypes";

export interface Props {
  project: Project;
  checkIns: ProjectCheckIn[];
  onTaskCreate: (args: { name: string }) => Promise<void>;
}
```

**When the UI needs a different shape — custom type in TurboUI:**

Re-export from `ApiTypes` where possible; add view-specific fields only when
needed (`turboui/src/ResourceHub/types.ts` is the reference):

```tsx
import type { ResourceHub as ApiResourceHub } from "../ApiTypes";

export type ResourceHub = ApiResourceHub;

export interface ResourceHubListParent {
  id: string;
  name: string;
  type: "resource_hub" | "folder";
}
```

**When display logic is needed — transform inside TurboUI**, not in the app.

**Do not** add new `parse*ForTurboUi` or `prepare*` helpers in
`app/assets/js/models/` for new components. Legacy pages still contain these;
replace them opportunistically when migrating a page, not by default.

**App bridge still owns** (these are not data-type concerns):

- Link/path resolution via `usePaths()` or callbacks like `getNodePath`
- Locale, timezone, and permission context passed as props
- API mutations wired through callbacks

## TurboUI Component Examples

Study these before building similar UI:

| Component | Path | Why |
| --------- | ---- | --- |
| `ResourceHubPage` | `turboui/src/ResourceHubPage/` | Full page with `Props` type, `mockData.ts`, Storybook stories |
| `ProjectPage` | `turboui/src/ProjectPage/` | Large editable page with tasks, milestones, check-ins |
| `MilestonePage` | `turboui/src/MilestonePage/` | Editable page with timeline, tasks, comments |
| `WorkMapPage` | `turboui/src/WorkMapPage/` | Interactive list with inline creation |
| `CheckInCard` | `turboui/src/CheckInCard/` | Smaller composed component using `FormattedTime` |
| `DiscussionCard` | `turboui/src/DiscussionCard/` | Card pattern with relative dates |

### Props type pattern

Export a `Props` interface from the TurboUI component. The app page types its
props object against it:

```tsx
// turboui
export interface Props { title: string; onSave: (name: string) => void; }

// app
const props: MyComponent.Props = { title: data.name, onSave: handleSave };
return <MyComponent {...props} />;
```

## Storybook Pattern

From `turboui/src/ResourceHubPage/index.stories.tsx`:

```tsx
const meta = {
  title: "Pages/ResourceHubPage",
  component: ResourceHubPage,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof ResourceHubPage>;

function StoryPage({ empty = false }: { empty?: boolean }) {
  const [nodes, setNodes] = React.useState(() => (empty ? [] : [createMockDocumentNode()]));
  const sharedProps = useMockSharedListPageProps({ parent: resourceHub, nodes, setNodes });
  return <ResourceHubPage {...sharedProps} />;
}

export const Default: Story = { render: () => <StoryPage /> };
export const Empty: Story = { render: () => <StoryPage empty /> };
```

Rules:

- Mock data in `mockData.ts` or story file — never in the component
- Stories cover empty, populated, and interactive states
- Callbacks log to console or update local story state

## Design System Quick Reference

- **Colors**: semantic classes from design system (`content-subtle`, `content-error`); see `turboui/src/Colors/Colors.stories.tsx`
- **Buttons**: `PrimaryButton`, `SecondaryButton`, etc. — not a generic `Button`
- **Icons**: Tabler icons via `turboui/src/icons/` (`IconEdit`, …)
- **Empty states**: preserve container structure; include a clear next action
- **Locale/timezone**: pass as props from app; do not hard-code `"en-US"` in TurboUI

## Legacy UI (Do Not Extend)

Examples of deprecated patterns that should be migrated over time, not copied:

- `app/assets/js/components/FormattedTime/` — duplicate of `turboui/src/FormattedTime/` with app context baked in
- `app/assets/js/features/activities/GoalDueDateUpdating/` — activity feed UI in app features
- `app/assets/js/features/CommentSection/` — should live in TurboUI
- `parse*ForTurboUi` / `prepare*` helpers in `app/assets/js/models/` — replaced by `ApiTypes` and TurboUI-side typing

When touching legacy UI for a new feature, follow Scenario 2a or 2b from SKILL.md.
