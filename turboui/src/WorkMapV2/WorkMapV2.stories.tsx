import React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "storybook/test";
import { defaultFormattedTimePreferences } from "../FormattedTime";
import { WorkMapV2Page, defaultWorkMapV2Filters, type WorkMapV2Item, type WorkMapV2PageProps } from ".";

const growth = { name: "Growth & GTM" };
const product = { name: "Product" };
const filip = person("Filip B.");
const marko = person("Marko A.");

function person(fullName: string) {
  return { id: fullName, fullName, avatarUrl: null };
}

function item(
  name: string,
  progress: number,
  date: string | null,
  nextStep: string,
  fields: Partial<WorkMapV2Item> = {},
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
          contextualStartDate: null,
          contextualEndDate: { __typename: "contextual_date", dateType: "day", value: date, date },
        }
      : null,
    space: product,
    spacePath: null,
    owner: marko,
    ownerPath: null,
    nextStep,
    children: [],
    ...fields,
  };
}

const items = [
  item("Grow adoption among engineering teams", 61, "2027-03-31", "Review pilot feedback", {
    type: "goal",
    space: growth,
    owner: filip,
    children: [
      item("Design partner program", 65, "2026-11-27", "Interview pilot teams", { space: growth, owner: filip }),
      item("Improve first-run onboarding", 42, "2026-12-18", "Test the new flow", { space: growth, status: "caution" }),
      item("Pilot onboarding guide", 100, "2026-10-30", "", {
        space: growth,
        owner: filip,
        state: "closed",
        status: "achieved",
      }),
    ],
  }),
  item("Ship SuperPlane v1.2", 54, "2026-12-31", "Finalize release scope", {
    type: "goal",
    children: [
      item("Custom automations", 75, "2026-11-30", "Implementation", { owner: person("Igor Š."), status: "caution" }),
      item("GitHub Enterprise", 48, "2026-12-11", "Documentation", { owner: person("Andre C.") }),
      item("Self-hosted runners", 0, null, "Scope the discovery", { owner: person("Lucas P."), status: "pending" }),
      item("Release documentation", 25, "2026-12-21", "Draft release notes", { owner: person("Pedro L.") }),
      item("Release candidate testing", 100, "2026-10-23", "", { state: "closed", status: "achieved" }),
    ],
  }),
  item("Community office hours", 33, "2026-12-04", "Publish the agenda", { space: growth, owner: filip }),
];

function StoryPage(props: WorkMapV2PageProps) {
  const [filters, setFilters] = React.useState(props.filters);
  return <WorkMapV2Page {...props} filters={filters} onFiltersChange={setFilters} />;
}

const meta = {
  title: "Pages/Work Map V2",
  component: WorkMapV2Page,
  render: (args) => <StoryPage {...args} />,
  args: {
    title: "SuperPlane Work Map",
    items,
    filters: defaultWorkMapV2Filters,
    formattedTimePreferences: defaultFormattedTimePreferences,
  },
} satisfies Meta<typeof WorkMapV2Page>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ActiveWork: Story = {};

export const NestedSpaceMap: Story = {
  args: {
    title: "Product Work Map",
    items: [
      item("Ship SuperPlane v1.2", 54, null, "Finalize release scope", {
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
    await userEvent.click(canvas.getByRole("button", { name: /Collapse Ship SuperPlane/ }));
    await userEvent.click(canvas.getByRole("button", { name: /Expand Ship SuperPlane/ }));
    await expect(canvas.getByRole("button", { name: /Improve release quality/, expanded: false })).toBeVisible();
    await userEvent.click(canvas.getByRole("button", { name: /Expand Improve release quality/ }));
  },
};

export const CompletedProjects: Story = {
  args: { filters: { workTypes: ["project"], lifecycle: ["closed"] } },
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

    await userEvent.click(canvas.getByRole("button", { name: "Active work" }));
    const clearFilter = await body.findByRole("menuitem", { name: "Clear filter" });
    clearFilter.focus();
    await userEvent.keyboard("{Enter}");
    await waitFor(() => expect(canvas.getByRole("button", { name: "Filter" })).toHaveFocus());
  },
};

export const NoMatchingProjects: Story = {
  args: { filters: { lifecycle: ["paused"], workTypes: ["project"] } },
};

export const ClearFilters: Story = {
  ...NoMatchingProjects,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.queryByRole("table")).not.toBeInTheDocument();
    await userEvent.click(canvas.getByRole("button", { name: "Clear filters" }));
    await expect(canvas.getAllByRole("rowheader")).toHaveLength(11);
  },
};
export const EmptyMap: Story = { args: { items: [] } };

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
