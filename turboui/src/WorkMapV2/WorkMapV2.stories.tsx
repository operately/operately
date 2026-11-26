import React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import type { WorkMapKpi } from "../ApiTypes";
import type { WorkMapKpiStrip } from "./KpiStrip";
import { CompanyNavigation } from "../CompanyNavigation";
import { defaultProps as navigationProps } from "../CompanyNavigation/mockData";
import type { ReviewerEditing } from "./ReviewerField";
import { move, type OrganizationDraft } from "./organization";
import { filterWorkMap, type WorkMapRow } from "./filterWorkMap";
import { defaultFormattedTimePreferences } from "../FormattedTime";
import { WorkMapV2Page, builtInWorkMapView, type WorkMapV2Item, type WorkMapV2PageProps } from ".";

const growth = { id: "growth", name: "Growth & GTM" };
const product = { id: "product", name: "Product" };
const filip = person("Filip B.");
const marko = person("Marko A.");
const productSpace = { id: "product", name: "Product", link: "/spaces/product" };

function person(fullName: string) {
  return { id: fullName, fullName, avatarUrl: null };
}

function item(
  name: string,
  progress: number,
  date: string | null,
  nextStep: string,
  fields: Partial<WorkMapV2Item> = {},
  start: string | null = date ? "2026-10-16" : null,
): WorkMapV2Item {
  const id = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
  return {
    id,
    name,
    type: "project",
    state: "active",
    status: "on_track",
    progress,
    itemPath: "#" + id,
    timeframe: date
      ? {
          __typename: "timeframe",
          contextualStartDate: start
            ? { __typename: "contextual_date", dateType: "day", value: start, date: start }
            : null,
          contextualEndDate: { __typename: "contextual_date", dateType: "day", value: date, date },
        }
      : null,
    space: product,
    spacePath: null,
    owner: marko,
    reviewer: filip,
    ownerPath: null,
    nextStep,
    children: [],
    ...fields,
  };
}

const items = [
  item(
    "Grow adoption among engineering teams",
    61,
    "2027-03-31",
    "Review pilot feedback",
    {
      type: "goal",
      space: growth,
      owner: filip,
      children: [
        item(
          "Design partner program",
          65,
          "2026-11-27",
          "Interview pilot teams",
          { space: growth, owner: filip },
          "2026-10-10",
        ),
        item(
          "Improve first-run onboarding",
          42,
          "2026-12-18",
          "Test the new flow",
          {
            space: growth,
            status: "caution",
          },
          "2026-11-06",
        ),
        item("Pilot onboarding guide", 100, "2026-10-30", "", {
          space: growth,
          owner: filip,
          state: "closed",
          status: "achieved",
        }),
      ],
    },
    "2026-04-01",
  ),
  item("Ship Nexus Dynamics v1.2", 54, "2026-12-31", "Finalize release scope", {
    type: "goal",
    children: [
      item(
        "Custom automations",
        75,
        "2026-11-30",
        "Implementation",
        {
          owner: person("Igor Š."),
          status: "caution",
          milestones: [
            {
              __typename: "work_map_milestone",
              id: "beta",
              title: "Beta",
              status: "pending",
              timeframe: {
                __typename: "timeframe",
                contextualStartDate: null,
                contextualEndDate: {
                  __typename: "contextual_date",
                  dateType: "day",
                  date: "2026-11-18",
                  value: "2026-11-18",
                },
              },
            },
          ],
        },
        "2026-10-25",
      ),
      item("GitHub Enterprise", 48, "2026-12-11", "Documentation", { owner: person("Andre C.") }, "2026-11-15"),
      item("Self-hosted runners", 0, null, "Scope the discovery", { owner: person("Lucas P."), status: "pending" }),
      item(
        "Release documentation",
        25,
        "2026-12-21",
        "Draft release notes",
        { owner: person("Pedro L.") },
        "2026-11-30",
      ),
      item("Release candidate testing", 100, "2026-10-23", "", { state: "closed", status: "achieved" }),
    ],
  }),
  item("Community office hours", 33, "2026-12-04", "Publish the agenda", { space: growth, owner: filip }, null),
];

const searchReviewers: ReviewerEditing["search"] = async (item, query) =>
  [filip, marko].filter(
    (person) =>
      person.id !== item.owner?.id &&
      person.id !== item.reviewer?.id &&
      person.fullName.toLowerCase().includes(query.toLowerCase()),
  );

function kpi(name: string, space: typeof product, unit: string, recentValues: number[]): WorkMapKpi {
  return {
    __typename: "work_map_kpi",
    id: name,
    name,
    spaceId: space.id,
    spaceName: space.name,
    unit,
    cadence: "weekly",
    recentValues,
    value: recentValues.at(-1) ?? null,
    period: recentValues.length ? "2026-11-16" : null,
  };
}

const storyKpis = [
  kpi("Weekly active teams", product, "teams", [96, 104, 101, 112, 124, 128]),
  kpi("Design partners", growth, "teams", [7, 7, 9, 8, 11, 12]),
  kpi("Successful runs", product, "%", [97, 97.8, 97.5, 98.1, 98.4]),
  kpi("Customer interviews", growth, "interviews", [5, 8]),
  kpi("Median run time", product, "s", [56, 50, 42]),
];

type KpiState = "pinned" | "unpinned" | "first-use" | "error";
function useStoryKpis(state: KpiState, spaceId?: string): WorkMapKpiStrip {
  const available = state === "first-use" ? [] : storyKpis.filter((kpi) => !spaceId || kpi.spaceId === spaceId);
  const [ids, save] = React.useState(state === "unpinned" ? [] : available.slice(0, 3).map((k) => k.id));
  const [input, search] = React.useState<{ query: string; offset: number } | null>(null);
  const [error, setError] = React.useState(state === "error");
  return {
    pins: ids.flatMap((id) => available.filter((k) => k.id === id)),
    limit: 3,
    hasKpis: available.length > 0,
    loading: false,
    error,
    retry: () => setError(false),
    detailPath: (k) => "#kpi-" + k.id,
    allPath: spaceId ? "#space-kpis" : undefined,
    createPath: "#new-kpi",
    results: available.filter((k) => k.name.toLowerCase().includes(input?.query.toLowerCase() ?? "")),
    search,
    searching: false,
    searchError: false,
    retrySearch: () => {},
    hasMore: false,
    saving: false,
    save,
  };
}

function StoryPage({
  editableReviewers,
  kpiState = "pinned",
  ...props
}: WorkMapV2PageProps & { editableReviewers?: boolean; kpiState?: KpiState }) {
  const kpis = useStoryKpis(kpiState, props.space?.id);
  const [view, setView] = React.useState(props.view);
  const [defaults, setDefaults] = React.useState(builtInWorkMapView(Boolean(props.space)));
  const [storyItems, setItems] = React.useState(props.items);
  const [order, setOrder] = React.useState<string[]>([]);
  const spaces = [productSpace, { ...growth, link: "/spaces/growth" }];
  function toItem(row: WorkMapRow): WorkMapV2Item {
    return { ...row.item, children: row.children.map(toItem) };
  }
  return (
    <WorkMapV2Page
      {...props}
      kpis={kpis}
      items={storyItems}
      reviewerEditing={
        editableReviewers
          ? {
              canEdit: () => true,
              search: searchReviewers,
              save: async (item, reviewer) => {
                function update(row: WorkMapV2Item): WorkMapV2Item {
                  return row.id === item.id
                    ? { ...row, reviewer, reviewerPath: null }
                    : { ...row, children: row.children.map(update) };
                }
                setItems((items) => items.map(update));
              },
            }
          : undefined
      }
      orderedItemIds={order}
      organization={{
        canReparent: () => true,
        save: async (ids, changes) => {
          let draft: OrganizationDraft = {
            rows: filterWorkMap(storyItems, { ...defaults, filters: [] }, [], "en", "UTC").rows,
            parentChanges: [],
          };
          for (const change of changes) {
            draft = move(draft, change.itemId, change.parentId ?? null, "inside", true);
          }
          setItems(draft.rows.map(toItem));
          setOrder(ids);
          return true;
        },
      }}
      creation={{
        spaces,
        defaultSpace: productSpace,
        onFirstItemCreated: kpiState === "first-use" ? () => {} : undefined,
        spaceSearch: async () => spaces,
        templates: [
          { id: "release", name: "Release checklist", spaceId: product.id, milestoneCount: 3, taskCount: 14 },
          { id: "discovery", name: "Feature discovery", spaceId: product.id, milestoneCount: 2, taskCount: 8 },
          { id: "launch", name: "Integration launch", spaceId: product.id, milestoneCount: 4, taskCount: 12 },
        ],
        templateLibraryPath: "/project-templates",
        save: async ({ name, type, space, parentId }) => {
          const created = item(name, 0, null, "", { type, space, status: "pending", owner: null });
          function insert(rows: WorkMapV2Item[]): WorkMapV2Item[] {
            return rows.map((row) => ({
              ...row,
              children: row.id === parentId ? [...row.children, created] : insert(row.children),
            }));
          }
          setItems((previous) => (parentId ? insert(previous) : [...previous, created]));
          return { id: created.id };
        },
      }}
      view={view}
      onViewChange={setView}
      onReset={() => setView(defaults)}
      onSaveDefault={() => setDefaults(view)}
      adjusted={JSON.stringify(view) !== JSON.stringify(defaults)}
    />
  );
}

function projectView(lifecycle: string): WorkMapV2PageProps["view"] {
  return {
    ...builtInWorkMapView(false),
    filters: [
      { field: "work_type", operator: "is_any_of", values: ["project"] },
      { field: "lifecycle", operator: "is_any_of", values: [lifecycle] },
    ],
  };
}

const meta = {
  title: "Pages/Work Map V2",
  component: WorkMapV2Page,
  render: (args) => <StoryPage {...args} />,
  args: {
    title: "Nexus Dynamics Work Map",
    items,
    view: builtInWorkMapView(false),
    scopeName: "Nexus Dynamics",
    onViewChange: () => {},
    onReset: () => {},
    adjusted: false,
    formattedTimePreferences: defaultFormattedTimePreferences,
  },
} satisfies Meta<typeof WorkMapV2Page>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ActiveWork: Story = {};

export const ManagePins: Story = {
  render: (args) => <StoryWithNavigation {...args} />,
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(within(canvasElement).getByRole("button", { name: "Manage pins" }));
    const panel = within(await body.findByRole("dialog"));
    await expect(panel.getByRole("button", { name: "Pin Median run time" })).toBeDisabled();
    panel.getByRole("button", { name: "Unpin Successful runs" }).focus();
    await userEvent.keyboard("{Enter}");
    await expect(panel.getByRole("textbox")).toHaveFocus();
    await userEvent.type(panel.getByRole("textbox"), "Median");
    await userEvent.click(panel.getByRole("button", { name: "Pin Median run time" }));
    await userEvent.clear(panel.getByRole("textbox"));
    await userEvent.click(panel.getByRole("button", { name: "Unpin Median run time" }));
    await userEvent.click(await panel.findByRole("button", { name: "Pin Successful runs" }));
    panel.getByRole("button", { name: "Reorder Design partners" }).focus();
    await userEvent.keyboard("{ArrowUp}");
    await expect(within(canvasElement).getByRole("region", { name: "KPIs" }).querySelector("a")).toHaveTextContent(
      "Design partners",
    );
  },
};

export const FirstKpi: Story = {
  args: { items: [] },
  render: (args) => <StoryWithNavigation {...args} kpiState="first-use" />,
};

export const RetryKpis: Story = {
  render: (args) => <StoryPage {...args} kpiState="error" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const strip = within(canvas.getByRole("region", { name: "KPIs" }));
    await expect(canvas.getByRole("table")).toBeVisible();
    await userEvent.click(strip.getByRole("button", { name: "Try again" }));
    await expect(strip.getByRole("link", { name: /Weekly active teams/ })).toBeVisible();
  },
};

export const OrganizeMap: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Organize" }));
    await expect(canvas.getByRole("link", { name: "Design partner program" })).toBeVisible();
    await expect(canvas.queryByRole("link", { name: "Pilot onboarding guide" })).not.toBeInTheDocument();
  },
};

export const InlineReviewer: Story = {
  args: {
    space: { id: product.id, name: product.name, href: productSpace.link },
    view: builtInWorkMapView(true),
    scopeName: product.name,
  },
  render: (args) => <StoryPage {...args} editableReviewers />,
  play: async ({ canvasElement }) => {
    const row = within(canvasElement).getByRole("link", { name: "GitHub Enterprise" }).closest("tr");
    if (!row) throw new Error("Reviewer row is missing");
    await userEvent.click(within(row).getByRole("button", { name: /Filip/ }));
    const picker = within(canvasElement.ownerDocument.body);
    await userEvent.click(picker.getByRole("button", { name: "Remove reviewer" }));
    await userEvent.click(within(row).getByRole("button", { name: "Assign reviewer" }));
    await userEvent.click(await within(picker.getByRole("dialog")).findByText(marko.fullName));
    await expect(within(row).getByRole("button", { name: /Marko/ })).toBeVisible();
  },
};

export const AddWorkMenu: Story = {
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(within(canvasElement).getByRole("button", { name: "Add work" }));
    await userEvent.hover(await body.findByRole("menuitem", { name: "Project from template…" }));
  },
};

export const ProjectTemplates: Story = {
  args: {
    space: { id: product.id, name: product.name, href: productSpace.link },
    view: builtInWorkMapView(true),
    scopeName: product.name,
  },
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(within(canvasElement).getByRole("button", { name: "Add work" }));
    await userEvent.click(await body.findByRole("menuitem", { name: "Project from template…" }));
    await expect(body.getByRole("button", { name: /Release checklist/, pressed: true })).toBeVisible();
    body.getByRole("button", { name: "Use template" }).focus();
    await userEvent.tab();
    await expect(body.getByRole("button", { name: "Close" })).toHaveFocus();
    await userEvent.keyboard("{Escape}");
    const addWork = within(canvasElement).getByRole("button", { name: "Add work" });
    await expect(addWork).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    await userEvent.click(await body.findByRole("menuitem", { name: "Project from template…" }));
  },
};

export const Timeline: Story = {
  args: { view: { ...builtInWorkMapView(false), view: "timeline" } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);
    await expect(canvas.getByText("No dates")).toBeVisible();
    await userEvent.click(canvas.getByRole("button", { name: /Collapse Ship Nexus Dynamics/ }));
    await userEvent.click(canvas.getByRole("button", { name: "Table" }));
    await expect(canvas.queryByRole("link", { name: "Self-hosted runners" })).not.toBeInTheDocument();
    await userEvent.click(canvas.getByRole("button", { name: "Timeline" }));
    await userEvent.click(canvas.getByRole("button", { name: /Expand Ship Nexus Dynamics/ }));
    await userEvent.click(canvas.getByRole("button", { name: "Months" }));
    await userEvent.click(await body.findByRole("menuitem", { name: "Weeks" }));
    await expect(canvas.getByRole("button", { name: "Weeks" })).toBeVisible();
    await userEvent.click(canvas.getByRole("button", { name: "Reset view" }));
    await userEvent.click(canvas.getByRole("button", { name: "Timeline" }));
  },
};

export const NestedSpaceMap: Story = {
  args: {
    title: "Product Work Map",
    space: { id: productSpace.id, name: productSpace.name, href: productSpace.link },
    scopeName: "Product",
    view: builtInWorkMapView(true),
    items: [
      item("Ship Nexus Dynamics v1.2", 54, null, "Finalize release scope", {
        type: "goal",
        timeframe: {
          __typename: "timeframe",
          contextualStartDate: null,
          contextualEndDate: {
            __typename: "contextual_date",
            date: "2026-12-31",
            dateType: "quarter",
            value: "Q4 2026",
          },
        },
        children: [
          item("Improve release quality", 75, null, "", {
            type: "goal",
            children: [item("Custom automations", 75, null, "Implementation")],
          }),
        ],
      }),
    ],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("cell", { name: "Q4 2026" })).toBeVisible();
    await userEvent.click(canvas.getByRole("button", { name: /Collapse Improve release quality/ }));
    await userEvent.click(canvas.getByRole("button", { name: /Collapse Ship Nexus Dynamics/ }));
    await userEvent.click(canvas.getByRole("button", { name: /Expand Ship Nexus Dynamics/ }));
    await expect(canvas.getByRole("button", { name: /Improve release quality/, expanded: false })).toBeVisible();
    await userEvent.click(canvas.getByRole("button", { name: /Expand Improve release quality/ }));
  },
};

export const CompletedProjects: Story = {
  args: { view: projectView("closed") },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getAllByRole("rowheader")).toHaveLength(4);
    await expect(canvas.getAllByText("Parent goal")).toHaveLength(2);
    await expect(canvas.getByRole("status")).toHaveTextContent("2 matching projects");
    const toggle = canvas.getByRole("button", { expanded: true, name: /Grow adoption/ });
    toggle.focus();
    await userEvent.keyboard("{Enter}");
    await expect(canvas.queryByRole("link", { name: "Pilot onboarding guide" })).not.toBeInTheDocument();
    await expect(canvas.getByRole("link", { name: "Release candidate testing" })).toBeVisible();
    await expect(canvas.getByRole("status")).toHaveTextContent("2 matching projects");
    await userEvent.keyboard("{Enter}");

    const choices = await openFilterChoices(canvasElement, "Lifecycle");
    await waitFor(() =>
      expect(choices.getByRole("menuitemcheckbox", { name: "Completed", checked: true })).toBeVisible(),
    );
  },
};

export const ChangeFilters: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(canvasElement.ownerDocument.body);
    const choices = await openFilterChoices(canvasElement, "Work type");
    await userEvent.click(await choices.findByRole("menuitemcheckbox", { name: "Projects" }));
    await userEvent.keyboard("{Escape}{Escape}");
    await userEvent.click(canvas.getByRole("button", { name: "Active work" }));
    await userEvent.click(await body.findByRole("menuitemcheckbox", { name: "Completed" }));
    await userEvent.click(body.getByRole("menuitemcheckbox", { name: "Active" }));
    await userEvent.keyboard("{Escape}");
    await expect(canvas.getAllByRole("rowheader")).toHaveLength(4);
    await expect(canvas.getByRole("status")).toHaveTextContent("2 matching projects");
    await userEvent.click(canvas.getByRole("button", { name: "Reset view" }));
    await expect(canvas.getAllByRole("rowheader")).toHaveLength(9);

    const dates = await openFilterChoices(canvasElement, "Due date");
    const preset = await dates.findByRole("menuitemcheckbox", { name: "In the past" });
    await userEvent.click(preset);
    await expect(preset).toBeChecked();
    await userEvent.click(preset);
    await expect(preset).not.toBeChecked();
    await userEvent.keyboard("{Escape}{Escape}");

    await userEvent.click(canvas.getByRole("button", { name: "Active work" }));
    const clearFilter = await body.findByRole("menuitem", { name: "Clear filter" });
    clearFilter.focus();
    await userEvent.keyboard("{Enter}");
    await waitFor(() => expect(canvas.getByRole("button", { name: "Filter" })).toHaveFocus());
    await expect(canvas.queryByRole("button", { name: "Reset view" })).not.toBeInTheDocument();
  },
};

export const NoMatchingProjects: Story = {
  args: { view: projectView("paused") },
};

export const ClearFilters: Story = {
  ...NoMatchingProjects,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.queryByRole("table")).not.toBeInTheDocument();
    await expect(canvas.getByRole("button", { name: "Filter" })).toBeVisible();
    await userEvent.click(canvas.getByRole("button", { name: "Clear filters" }));
    await expect(canvas.getAllByRole("rowheader")).toHaveLength(11);
  },
};

function StoryWithNavigation(props: WorkMapV2PageProps & { kpiState?: KpiState }) {
  return (
    <div className="flex h-screen flex-col">
      <CompanyNavigation
        {...navigationProps}
        companyName="Nexus Dynamics"
        unreadNotificationCount={0}
        reviewCount={0}
        me={{ ...navigationProps.me, fullName: "Marko A.", avatarUrl: null }}
      />
      <div className="relative min-h-0 flex-1 overflow-auto [anchor-name:--company-page]">
        <StoryPage {...props} />
      </div>
    </div>
  );
}

export const EmptyMap: Story = {
  name: "Empty space map",
  render: (args) => <StoryWithNavigation {...args} kpiState="unpinned" />,
  args: {
    items: [],
    title: "Product Work Map",
    space: { id: productSpace.id, name: productSpace.name, href: productSpace.link },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.queryByRole("button", { name: "Filter" })).not.toBeInTheDocument();
    await expect(canvas.getByRole("button", { name: "Add a project" })).toBeVisible();
    await expect(canvas.getByRole("button", { name: "Add a goal" })).toBeVisible();
  },
};

async function openFilterChoices(canvasElement: HTMLElement, label: string) {
  await userEvent.click(within(canvasElement).getByRole("button", { name: "Filter" }));
  const body = within(canvasElement.ownerDocument.body);
  const group = body.queryByRole("group", { name: label });
  if (group) return within(group);

  const submenu = await body.findByRole("menuitem", { name: label });
  submenu.focus();
  await userEvent.keyboard("{ArrowRight}");
  return body;
}
