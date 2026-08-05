import type { Meta, StoryObj } from "@storybook/react-vite";
import * as React from "react";

import type { SearchResult } from "../ApiTypes";
import { defaultFormattedTimePreferences } from "../FormattedTime";
import { IconCalendar, IconLayoutGrid, IconWorld } from "../icons";
import { SEARCH_TIME_FILTER_OPTIONS, SEARCH_TYPE_FILTER_OPTIONS, SearchPage } from "./index";

const meta = {
  title: "Pages/SearchPage",
  component: SearchPage,
  parameters: {
    layout: "fullscreen",
    reactRouter: {
      path: "/acme/search",
      routePath: "/:companyId/search",
    },
  },
  args: {
    formattedTimePreferences: defaultFormattedTimePreferences,
  },
} satisfies Meta<typeof SearchPage>;

export default meta;
type Story = StoryObj<typeof meta>;

function result(overrides: Partial<SearchResult & { link: string }> = {}): SearchPage.Result {
  return {
    __typename: "result",
    id: "project-1",
    type: "project",
    title: "Website redesign",
    context: "Marketing",
    matchedField: "description",
    snippet:
      "Customer research supports simplifying the information architecture and making the approval workflow easier to understand.",
    state: "closed",
    insertedAt: "2026-07-28T12:00:00.000Z",
    navigationTarget: { projectId: "project-1" },
    link: "/acme/projects/project-1",
    ...overrides,
  };
}

function InteractivePage(
  props: Omit<SearchPage.Props, "query" | "onQueryChange" | "formattedTimePreferences"> & {
    initialQuery?: string;
    formattedTimePreferences?: SearchPage.Props["formattedTimePreferences"];
  },
) {
  const { initialQuery, formattedTimePreferences = defaultFormattedTimePreferences, ...pageProps } = props;
  const [query, setQuery] = React.useState(initialQuery ?? "");

  return (
    <SearchPage
      {...pageProps}
      query={query}
      onQueryChange={setQuery}
      formattedTimePreferences={formattedTimePreferences}
    />
  );
}

const DEFAULT_FILTER_SELECTIONS: Record<string, string[]> = {
  spaces: [],
  types: [],
  time: [],
};

function buildRefineFilters(selections: Record<string, string[]>): SearchPage.RefineFilter[] {
  return [
    {
      id: "spaces",
      label: "All spaces",
      icon: IconWorld,
      selectionMode: "multiple",
      selectedOptionIds: selections.spaces,
      options: [
        { id: "product", label: "Product" },
        { id: "marketing", label: "Marketing" },
        { id: "engineering", label: "Engineering" },
      ],
    },
    {
      id: "types",
      label: "All types",
      icon: IconLayoutGrid,
      selectionMode: "multiple",
      selectedOptionIds: selections.types,
      options: SEARCH_TYPE_FILTER_OPTIONS,
    },
    {
      id: "time",
      label: "All time",
      icon: IconCalendar,
      selectionMode: "single",
      selectedOptionIds: selections.time,
      options: SEARCH_TIME_FILTER_OPTIONS,
    },
  ];
}

function InteractiveRefinePage({
  initialQuery = "customer evidence",
  results,
}: {
  initialQuery?: string;
  results: SearchPage.Result[];
}) {
  const [query, setQuery] = React.useState(initialQuery);
  const [sort, setSort] = React.useState<SearchPage.SortMode>("best_match");
  const [selections, setSelections] = React.useState(DEFAULT_FILTER_SELECTIONS);

  const refine: SearchPage.Refine = {
    sort,
    onSortChange: setSort,
    filters: buildRefineFilters(selections),
    onFilterChange: (filterId, selectedOptionIds) => {
      setSelections((current) => ({ ...current, [filterId]: selectedOptionIds }));
    },
  };

  return (
    <SearchPage
      query={query}
      onQueryChange={setQuery}
      status="success"
      results={results}
      formattedTimePreferences={defaultFormattedTimePreferences}
      refine={refine}
    />
  );
}

export const Initial: Story = {
  args: { query: "", status: "initial", results: [], onQueryChange: () => undefined },
  render: () => <InteractivePage status="initial" results={[]} />,
};

export const Loading: Story = {
  args: { query: "customer evidence", status: "loading", results: [], onQueryChange: () => undefined },
  render: () => <InteractivePage initialQuery="customer evidence" status="loading" results={[]} />,
};

export const Populated: Story = {
  args: { query: "customer evidence", status: "success", results: [], onQueryChange: () => undefined },
  render: () => (
    <InteractivePage
      initialQuery="customer evidence"
      status="success"
      results={[
        result(),
        result({
          id: "document-1",
          type: "resource_hub_document",
          title: "Customer research synthesis",
          context: "Product",
          matchedField: "content",
          state: null,
          navigationTarget: { documentId: "document-1" },
          link: "/acme/documents/document-1",
        }),
        result({
          id: "check-in-1",
          type: "goal_check_in",
          title: "Check-in on 2026-07-28",
          context: "Improve customer onboarding",
          matchedField: "message",
          state: "paused",
          navigationTarget: { goalCheckInId: "check-in-1" },
          link: "/acme/goal-check-ins/check-in-1",
        }),
      ]}
    />
  ),
};

export const HighlightedMatches: Story = {
  args: { query: "improve", status: "success", results: [], onQueryChange: () => undefined },
  render: () => (
    <InteractivePage
      initialQuery="improve"
      status="success"
      results={[
        result({
          id: "runway-review",
          type: "resource_hub_document",
          title: "Runway and Revenue Review",
          context: "Extend runway from Series A",
          matchedField: "content",
          snippet:
            "Paid acquisition efficiency improved week over week. Tighten discretionary marketing spend until CAC stabilizes.",
          state: null,
          navigationTarget: { documentId: "runway-review" },
          link: "/acme/documents/runway-review",
        }),
        result({
          id: "customer-feedback",
          type: "resource_hub_document",
          title: "Improve beta customer feedback",
          context: "Ship collaborative docs beta",
          matchedField: "content",
          snippet: "Real-time presence is the most requested improvement. Comment resolution needs clearer status.",
          state: null,
          navigationTarget: { documentId: "customer-feedback" },
          link: "/acme/documents/customer-feedback",
        }),
      ]}
    />
  ),
};

export const Empty: Story = {
  args: { query: "missing content", status: "success", results: [], onQueryChange: () => undefined },
  render: () => <InteractivePage initialQuery="missing content" status="success" results={[]} />,
};

export const Error: Story = {
  args: { query: "customer evidence", status: "error", results: [], onQueryChange: () => undefined },
  render: () => <InteractivePage initialQuery="customer evidence" status="error" results={[]} />,
};

export const LongContent: Story = {
  args: { query: "strategy", status: "success", results: [], onQueryChange: () => undefined },
  render: () => (
    <InteractivePage
      initialQuery="strategy"
      status="success"
      results={[
        result({
          title:
            "A deliberately long project title that demonstrates how search results behave when names need to wrap across several lines",
          context: "A space with a deliberately long name used to verify responsive wrapping",
          snippet: Array(8)
            .fill(
              "This long plain-text snippet demonstrates predictable wrapping and truncation without changing the layout.",
            )
            .join(" "),
        }),
      ]}
    />
  ),
};

export const HistoricalStates: Story = {
  args: { query: "review", status: "success", results: [], onQueryChange: () => undefined },
  render: () => (
    <InteractivePage
      initialQuery="review"
      status="success"
      results={[
        result({ id: "closed", title: "Closed project", state: "closed", link: "/closed" }),
        result({ id: "completed", title: "Completed goal", type: "goal", state: "completed", link: "/completed" }),
        result({ id: "milestone", title: "Launch beta", type: "milestone", state: "completed", link: "/milestone" }),
        result({ id: "task", title: "Interview customers", type: "task", state: "paused", link: "/task" }),
        result({ id: "person", title: "Taylor Reed", type: "person", matchedField: "title", snippet: "VP of Product", state: null, link: "/person" }),
        result({
          id: "archived",
          title: "Archived discussion",
          type: "discussion",
          state: "archived",
          link: "/archived",
        }),
        result({ id: "paused", title: "Paused check-in", type: "project_check_in", state: "paused", link: "/paused" }),
      ]}
    />
  ),
};

export const ThirtyResults: Story = {
  args: { query: "planning", status: "success", results: [], onQueryChange: () => undefined },
  render: () => (
    <InteractivePage
      initialQuery="planning"
      status="success"
      results={Array.from({ length: 30 }, (_, index) =>
        result({
          id: `result-${index}`,
          title: `Planning result ${index + 1}`,
          state: null,
          link: `/acme/results/${index + 1}`,
        }),
      )}
    />
  ),
};

const refineDemoResults = Array.from({ length: 30 }, (_, index) =>
  result({
    id: `refine-result-${index}`,
    title: `Customer evidence result ${index + 1}`,
    context: index % 2 === 0 ? "Product" : "Marketing",
    state: null,
    link: `/acme/results/${index + 1}`,
  }),
);

export const WithRefineControls: Story = {
  args: { query: "customer evidence", status: "success", results: refineDemoResults, onQueryChange: () => undefined },
  render: () => <InteractiveRefinePage results={refineDemoResults} />,
};

export const StickyRefineScrolling: Story = {
  args: { query: "customer evidence", status: "success", results: refineDemoResults, onQueryChange: () => undefined },
  parameters: {
    docs: {
      description: {
        story: "Scroll the page to validate that the search field and refine controls stay fixed at the top.",
      },
    },
  },
  render: () => <InteractiveRefinePage results={refineDemoResults} />,
};
