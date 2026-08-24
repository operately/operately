import type { Meta, StoryObj } from "@storybook/react-vite";
import React from "react";
import { useParams } from "react-router";

import { createMockRichEditorHandlers } from "../utils/storybook/richEditor";
import { SpaceKpisPage } from "./index";
import type { SpaceKpisPage as SpaceKpisPageNS } from "./types";
import { mockChampionSearch, mockCurrentUser, mockKpis, mockKpisLink, mockPeople, mockSpace } from "./mockData";

//
// Space KPIs — proof of concept (frontend, Storybook only).
//
// Demonstrates the end-to-end KPIs experience described in the POC:
//   - a KPIs space tool using the same page chrome (breadcrumb header + tool
//     title) as the other space tools (Work Map, Tasks)
//   - a list view: name, unit, cadence, champion, latest value + trend
//   - a detail view: line chart of history, last update + champion + cadence, "Log update"
//   - a "New KPI" form (name, unit, cadence, champion picker)
//   - an overflow "manage" menu on each KPI (list rows + detail header) to
//     Edit the KPI or Delete it (with a destructive confirmation)
//   - single-KPI "Log update" only — NO "update all KPIs at once" batch UI
//
// The stories use an in-memory harness so the create/edit/delete/record
// callbacks (which in the app call the createKpi / updateKpi / deleteKpi /
// recordKpiEntry GraphQL mutations) actually update the UI, letting reviewers
// exercise the happy path.
//
// Each KPI has its own page, so the harness reads the open KPI from the route
// (`/spaces/:spaceId/kpis/:kpiId`) the way the app does. Stories that show the
// detail view set that route through the `reactRouter` parameter.
//
type HarnessArgs = {
  loading?: boolean;
  error?: string | null;
  canManage?: boolean;
  emptySpace?: boolean;
  failMutations?: boolean;
};

// Opens a story on a single KPI's page.
function kpiRoute(kpiId: string) {
  return { reactRouter: { path: `${mockKpisLink}/${kpiId}`, routePath: `${mockKpisLink}/:kpiId` } };
}

const meta = {
  title: "Pages/SpaceKpisPage",
  component: SpaceKpisPage,
  parameters: {
    layout: "fullscreen",
  },
  render: (args: HarnessArgs) => <Harness {...args} />,
} satisfies Meta<HarnessArgs>;

export default meta;
type Story = StoryObj<HarnessArgs>;

function clone(kpis: SpaceKpisPageNS.Kpi[]): SpaceKpisPageNS.Kpi[] {
  return kpis.map((kpi) => ({ ...kpi, entries: kpi.entries.map((e) => ({ ...e })) }));
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function Harness(args: HarnessArgs) {
  const [kpis, setKpis] = React.useState<SpaceKpisPageNS.Kpi[]>(() => (args.emptySpace ? [] : clone(mockKpis)));
  const { kpiId } = useParams();

  const onCreateKpi = async (input: SpaceKpisPageNS.NewKpiInput): Promise<SpaceKpisPageNS.MutationResult> => {
    console.log("createKpi", input);
    await delay(400);

    if (args.failMutations) {
      return { success: false, error: "A KPI with that name already exists in this space." };
    }

    const champion = mockPeople.find((p) => p.id === input.championId) ?? null;
    const id = `kpi-${crypto.randomUUID()}`;
    const newKpi: SpaceKpisPageNS.Kpi = {
      id,
      name: input.name,
      description: null,
      unit: input.unit,
      cadence: input.cadence,
      champion,
      insertedAt: new Date(),
      link: `${mockKpisLink}/${id}`,
      latestEntry: null,
      entries: [],
    };

    setKpis((prev) => [newKpi, ...prev]);
    return { success: true, id: newKpi.id };
  };

  const onEditKpi = async (input: SpaceKpisPageNS.EditKpiInput): Promise<SpaceKpisPageNS.MutationResult> => {
    console.log("updateKpi", input);
    await delay(400);

    if (args.failMutations) {
      return { success: false, error: "A KPI with that name already exists in this space." };
    }

    const champion = mockPeople.find((p) => p.id === input.championId) ?? null;

    setKpis((prev) =>
      prev.map((kpi) =>
        kpi.id === input.id
          ? { ...kpi, name: input.name, unit: input.unit, cadence: input.cadence, champion }
          : kpi,
      ),
    );

    return { success: true, id: input.id };
  };

  const onDescriptionChange = async (kpiId: string, description: Record<string, unknown>) => {
    await delay(400);

    if (args.failMutations) return false;

    setKpis((prev) => prev.map((kpi) => (kpi.id === kpiId ? { ...kpi, description } : kpi)));
    return true;
  };

  const onDeleteKpi = async (kpiId: string): Promise<SpaceKpisPageNS.MutationResult> => {
    console.log("deleteKpi", kpiId);
    await delay(400);

    if (args.failMutations) {
      return { success: false, error: "You don't have permission to delete this KPI." };
    }

    setKpis((prev) => prev.filter((kpi) => kpi.id !== kpiId));
    return { success: true };
  };

  const onRecordEntry = async (input: SpaceKpisPageNS.RecordEntryInput): Promise<SpaceKpisPageNS.MutationResult> => {
    console.log("recordKpiEntry", input);
    await delay(400);

    if (args.failMutations) {
      return { success: false, error: "You don't have permission to update this KPI." };
    }

    setKpis((prev) =>
      prev.map((kpi) =>
        kpi.id === input.kpiId
          ? (() => {
              const entry = {
                id: `entry-${crypto.randomUUID()}`,
                value: input.value,
                recordedAt: new Date(),
                recordedBy: mockCurrentUser,
              };
              return { ...kpi, latestEntry: entry, entries: [...kpi.entries, entry] };
            })()
          : kpi,
      ),
    );

    return { success: true };
  };

  return (
    <SpaceKpisPage
      space={mockSpace}
      navigation={[{ to: mockSpace.link, label: mockSpace.name }]}
      kpisLink={mockKpisLink}
      kpis={kpis}
      selectedKpi={kpis.find((kpi) => kpi.id === kpiId) ?? null}
      currentUser={mockCurrentUser}
      championSearch={mockChampionSearch}
      richTextHandlers={createMockRichEditorHandlers()}
      onCreateKpi={onCreateKpi}
      onEditKpi={onEditKpi}
      onDescriptionChange={onDescriptionChange}
      onDeleteKpi={onDeleteKpi}
      onRecordEntry={onRecordEntry}
      loading={args.loading}
      error={args.error}
      canManage={args.canManage}
    />
  );
}

// The default list view with a healthy set of KPIs across both cadences.
export const Default: Story = {
  args: {},
};

// A single KPI's page, opened on one with lots of history — shows the line
// chart, trend, champion + cadence, and the recorded-updates log.
export const DetailView: Story = {
  parameters: kpiRoute("kpi-mrr"),
};

// Edge case: a KPI with a single entry can't plot a trend line yet, so its page
// shows a single-value card prompting for another update.
export const SingleEntry: Story = {
  parameters: kpiRoute("kpi-signups"),
};

// Edge case: a brand-new KPI with no entries — empty chart and "No data" states.
export const NoDataYet: Story = {
  parameters: kpiRoute("kpi-churn"),
};

// First-run experience: a space that has not created any KPIs yet.
export const EmptySpace: Story = {
  args: {
    emptySpace: true,
  },
};

// Data still loading via the route loader.
export const Loading: Story = {
  args: {
    loading: true,
  },
};

// The loader failed — surfaced through an error callout.
export const ErrorState: Story = {
  args: {
    error: "The KPIs service is temporarily unavailable.",
  },
};

// Read-only viewer (still any space member in the POC, but shows the UI with
// write actions hidden). No "New KPI" or "Log update" controls appear.
export const ReadOnly: Story = {
  args: {
    canManage: false,
  },
};

// Mutations fail — exercises inline error handling in the New KPI and
// Log update forms. Open a form and submit to see the error message.
export const MutationErrors: Story = {
  args: {
    failMutations: true,
  },
};
