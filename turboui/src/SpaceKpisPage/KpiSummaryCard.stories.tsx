import type { Meta, StoryObj } from "@storybook/react-vite";
import React from "react";

import { KpiSummaryCard } from "./KpiSummaryCard";
import { mockSingleKpi, mockSummaryKpis } from "./mockData";

//
// KPI summary card — proof of concept (frontend, Storybook only).
//
// Inner content for the KPIs tool card on the space home page. In the app it
// is wrapped by the shared SpaceTools Container (see
// app/assets/js/features/SpaceTools/components.tsx) so it matches Goals &
// Projects, Tasks, and Files.
//
const meta = {
  title: "Pages/SpaceKpisPage/KpiSummaryCard",
  component: KpiSummaryCard,
  parameters: {
    layout: "centered",
  },
  args: {
    canManage: true,
  },
  // Mirror the fixed-width SpaceTools card shell on the space home page.
  decorators: [
    (Story) => (
      <div className="text-xs w-full h-[380px] max-w-[340px] overflow-hidden border border-stroke-base bg-surface-base rounded-lg shadow-sm transition-shadow duration-300 hover:shadow hover:border-surface-outline group">
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

// The card lists up to maxRows KPIs to stay compact within the 380px tool slot.
export const ManyKpisTruncated: Story = {
  args: {
    kpis: mockSummaryKpis,
    maxRows: 2,
  },
};
