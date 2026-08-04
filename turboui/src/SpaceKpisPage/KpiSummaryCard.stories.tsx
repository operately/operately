import type { Meta, StoryObj } from "@storybook/react-vite";
import React from "react";

import { KpiSummaryCard } from "./KpiSummaryCard";
import { mockSingleKpi, mockSummaryKpis } from "./mockData";

//
// KPI summary card — proof of concept (frontend, Storybook only).
//
// A compact card summarising a single space's KPIs, meant to sit on the space
// home page alongside the other tool cards (Goals & Projects, Discussions,
// Tasks...). See app/assets/js/features/SpaceTools/ToolsSection.tsx for the
// intended integration point — the existing Kpis.tsx tool card would be
// replaced by this data-backed summary once a space home renders KPI data.
//
// Each row shows the KPI name, its latest value (formatted via the shared
// SpaceKpisPage/utils formatValue), a trend indicator, and a dependency-free
// sparkline of recent entries. Clicking a row calls onSelectKpi; clicking the
// header / footer / card background links to the full KPIs tab.
//
const meta = {
  title: "Pages/SpaceKpisPage/KpiSummaryCard",
  component: KpiSummaryCard,
  parameters: {
    layout: "centered",
  },
  args: {
    spaceKpisLink: "#kpis-tab",
    onSelectKpi: (kpiId: string) => console.log("select KPI", kpiId),
    canManage: true,
  },
  argTypes: {
    onSelectKpi: { action: "select KPI" },
  },
  // Mirror the fixed-width tool-card slot on the space home page.
  decorators: [
    (Story) => (
      <div className="w-[340px]">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof KpiSummaryCard>;

export default meta;
type Story = StoryObj<typeof meta>;

// Multiple KPIs with mixed trends: a rising metric, a volatile one, a
// single-entry metric (flat marker, no trend line), and a brand-new KPI with
// no data yet ("No data" row).
export const MultipleKpis: Story = {
  args: {
    kpis: mockSummaryKpis,
  },
};

// A space tracking a single KPI.
export const SingleKpi: Story = {
  args: {
    kpis: mockSingleKpi,
  },
};

// First-run experience: a space with no KPIs yet. Shows the card-level empty
// state with a "Track a KPI" call to action.
export const NoKpis: Story = {
  args: {
    kpis: [],
  },
};

// Same empty state for a read-only viewer — the call to action is hidden.
export const NoKpisReadOnly: Story = {
  args: {
    kpis: [],
    canManage: false,
  },
};

// Read-only rows are still navigable via the card / footer links, but the
// per-row onSelect handler is omitted so rows link into the KPIs tab instead.
export const RowsLinkWithoutHandler: Story = {
  args: {
    kpis: mockSummaryKpis,
    onSelectKpi: undefined,
  },
};

// The card collapses extra KPIs behind a "View all N KPIs" footer to stay
// compact. Here maxRows is lowered so the overflow footer is visible with the
// standard fixtures.
export const ManyKpisCollapsed: Story = {
  args: {
    kpis: mockSummaryKpis,
    maxRows: 2,
  },
};
