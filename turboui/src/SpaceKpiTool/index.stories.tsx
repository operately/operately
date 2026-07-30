import type { Meta, StoryObj } from "@storybook/react-vite";
import React from "react";

import { SpaceKpiTool } from "./index";
import { KpiCard } from "./KpiCard";
import { KpiChart } from "./KpiChart";
import { CreateKpiForm } from "./CreateKpiForm";
import { LogDataPointForm } from "./LogDataPointForm";
import { AddKpiDataPointInput, CreateKpiInput, Kpi } from "./types";
import { allKpis, churnRate, emptyKpi, monthlyRevenue, singlePointKpi, weeklySignups } from "./mockData";

/**
 * KPI space-tool POC
 * ==================
 *
 * A thin, end-to-end slice of the proposed KPI tool for Spaces, built in
 * Storybook to de-risk the design before it is split into hardening PRs. It
 * follows the existing optional-tools pattern (Tasks / Discussions / Resource
 * Hub) driven by `Operately.Groups.SpaceTools`.
 *
 * What this POC demonstrates (acceptance flow):
 *   1. Toggle `kpis_enabled` for a space.
 *   2. Create a KPI (name, unit, weekly|monthly cadence).
 *   3. Log data points for different periods and watch the chart render.
 *   4. Duplicate periods (same kpi_id + recorded_for) are rejected with a clear error.
 *
 * Reviewer notes / follow-up gaps for hardening PRs:
 *   - Chart is a dependency-free hand-rolled SVG; the follow-up should decide on
 *     a shared chart primitive rather than baking a library choice in now.
 *   - Notification fan-out on `add_kpi_data_point` is intentionally skipped here;
 *     the operation should create an activity record and (later) reuse the space
 *     notification fan-out used by other tools.
 *   - Permission model shown is coarse (`canEdit`); production should reuse the
 *     space edit-access permission check in the operations layer.
 *   - Duplicate detection is enforced client-side here for instant feedback AND
 *     server-side via a unique index on (kpi_id, recorded_for). This story's
 *     harness simulates the server rejection.
 */
const meta = {
  title: "Features/SpaceKpiTool",
  component: SpaceKpiTool,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof SpaceKpiTool>;

export default meta;
type Story = StoryObj<typeof meta>;

// ---------------------------------------------------------------------------
// Interactive harness: holds local state and simulates the server-side
// operations (create_kpi / add_kpi_data_point) including the unique-index
// rejection for duplicate periods.
// ---------------------------------------------------------------------------

function delay(ms = 400) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function InteractiveKpiTool(props: {
  initialEnabled?: boolean;
  initialKpis?: Kpi[];
  canEdit?: boolean;
  loading?: boolean;
}) {
  const [enabled, setEnabled] = React.useState(props.initialEnabled ?? true);
  const [kpis, setKpis] = React.useState<Kpi[]>(props.initialKpis ?? allKpis);

  const onCreateKpi = async (input: CreateKpiInput) => {
    await delay();
    console.log("create_kpi", input);
    const kpi: Kpi = {
      id: `kpi-${Date.now()}`,
      name: input.name,
      unit: input.unit,
      cadence: input.cadence,
      creator: "You",
      dataPoints: [],
    };
    setKpis((prev) => [...prev, kpi]);
  };

  const onAddDataPoint = async (input: AddKpiDataPointInput) => {
    await delay();
    console.log("add_kpi_data_point", input);

    // Simulate the server-side unique index on (kpi_id, recorded_for).
    const target = kpis.find((k) => k.id === input.kpiId);
    if (target?.dataPoints.some((dp) => dp.recordedFor === input.recordedFor)) {
      throw new Error(`A data point for ${input.recordedFor} already exists for this KPI.`);
    }

    setKpis((prev) =>
      prev.map((k) =>
        k.id === input.kpiId
          ? {
              ...k,
              dataPoints: [
                ...k.dataPoints,
                { id: `dp-${Date.now()}`, value: input.value, recordedFor: input.recordedFor, insertedBy: "You" },
              ],
            }
          : k,
      ),
    );
  };

  return (
    <SpaceKpiTool
      enabled={enabled}
      onToggleEnabled={setEnabled}
      kpis={kpis}
      canEdit={props.canEdit}
      loading={props.loading}
      onCreateKpi={onCreateKpi}
      onAddDataPoint={onAddDataPoint}
    />
  );
}

/**
 * Full end-to-end playground. Enable KPIs (already on), select a KPI to see its
 * detail + chart, create new KPIs, and log data points. Try logging two points
 * for different periods, then try logging a second point for the same period to
 * see the duplicate rejection.
 */
export const Playground: Story = {
  render: () => <InteractiveKpiTool initialEnabled initialKpis={allKpis} />,
};

/**
 * The tool starts disabled. Only the configuration toggle is shown; flipping it
 * reveals the space-page card. Mirrors adding `kpis_enabled` to the space tools
 * configuration UI.
 */
export const Disabled: Story = {
  render: () => <InteractiveKpiTool initialEnabled={false} initialKpis={allKpis} />,
};

/**
 * Enabled but no KPIs defined yet — shows the card zero state prompting the
 * first KPI.
 */
export const EmptyEnabled: Story = {
  render: () => <InteractiveKpiTool initialEnabled initialKpis={[]} />,
};

/** Data still loading — card shows skeleton placeholders. */
export const Loading: Story = {
  render: () => <InteractiveKpiTool initialEnabled initialKpis={allKpis} loading />,
};

/**
 * Read-only viewer (no space edit access). Create/log affordances are hidden.
 * Production should enforce this in the operations layer, not just the UI.
 */
export const ReadOnly: Story = {
  render: () => <InteractiveKpiTool initialEnabled initialKpis={allKpis} canEdit={false} />,
};

// ---------------------------------------------------------------------------
// Focused component stories
// ---------------------------------------------------------------------------

/** The KPIs card as it appears in the space ToolsSection grid. */
export const Card: StoryObj = {
  render: () => (
    <div className="p-8 flex justify-center bg-surface-dimmed min-h-screen">
      <KpiCard kpis={allKpis} onSelectKpi={(id) => console.log("select", id)} onAddKpi={() => console.log("add")} />
    </div>
  ),
};

export const CardZeroState: StoryObj = {
  render: () => (
    <div className="p-8 flex justify-center bg-surface-dimmed min-h-screen">
      <KpiCard kpis={[]} onAddKpi={() => console.log("add")} />
    </div>
  ),
};

export const CardLoading: StoryObj = {
  render: () => (
    <div className="p-8 flex justify-center bg-surface-dimmed min-h-screen">
      <KpiCard kpis={[]} loading />
    </div>
  ),
};

/** Chart states: a full series, a single point (edge case), and empty. */
export const Charts: StoryObj = {
  render: () => (
    <div className="p-8 space-y-8 max-w-xl">
      <ChartBlock title="Multiple data points (weekly)" kpi={weeklySignups} />
      <ChartBlock title="Currency series (monthly)" kpi={monthlyRevenue} />
      <ChartBlock title="Percentage series" kpi={churnRate} />
      <ChartBlock title="Single data point (centered dot)" kpi={singlePointKpi} />
      <ChartBlock title="Empty (no data points)" kpi={emptyKpi} />
    </div>
  ),
};

function ChartBlock({ title, kpi }: { title: string; kpi: Kpi }) {
  return (
    <div>
      <div className="text-sm font-bold text-content-base mb-2">{title}</div>
      <div className="border border-stroke-base rounded-lg p-4 bg-surface-base">
        <KpiChart dataPoints={kpi.dataPoints} unit={kpi.unit} width={480} height={180} detailed />
      </div>
    </div>
  );
}

/** Standalone "create KPI" form (the create_kpi mutation surface). */
export const CreateForm: StoryObj = {
  render: () => (
    <div className="p-8 max-w-md">
      <CreateKpiForm
        onSubmit={async (input) => {
          console.log("create_kpi", input);
          await delay();
        }}
        onCancel={() => console.log("cancel")}
      />
    </div>
  ),
};

/** Standalone "log data point" form. */
export const LogForm: StoryObj = {
  render: () => (
    <div className="p-8 max-w-md">
      <LogDataPointForm
        kpi={weeklySignups}
        onSubmit={async (input) => {
          console.log("add_kpi_data_point", input);
          await delay();
        }}
        onCancel={() => console.log("cancel")}
      />
    </div>
  ),
};

/**
 * Log form wired to a server that always rejects with the duplicate-period
 * error, so reviewers can see how the unique-index violation surfaces.
 */
export const LogFormServerError: StoryObj = {
  render: () => (
    <div className="p-8 max-w-md">
      <LogDataPointForm
        kpi={weeklySignups}
        onSubmit={async (input) => {
          await delay();
          throw new Error(`A data point for ${input.recordedFor} already exists for this KPI.`);
        }}
      />
    </div>
  ),
};
