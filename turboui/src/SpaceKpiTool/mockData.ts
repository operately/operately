import { Kpi } from "./types";

/**
 * Realistic mock data for the KPI space-tool POC stories.
 *
 * Per the turboui conventions, mock data lives in stories/fixtures — never in
 * the component files themselves.
 */

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

export const weeklySignups: Kpi = {
  id: "kpi-signups",
  name: "Weekly signups",
  unit: "users",
  cadence: "weekly",
  creator: "Alex Rivera",
  dataPoints: [
    { id: "dp-1", value: 120, recordedFor: daysAgo(42), insertedBy: "Alex Rivera" },
    { id: "dp-2", value: 138, recordedFor: daysAgo(35), insertedBy: "Alex Rivera" },
    { id: "dp-3", value: 131, recordedFor: daysAgo(28), insertedBy: "Alex Rivera" },
    { id: "dp-4", value: 165, recordedFor: daysAgo(21), insertedBy: "Jordan Lee" },
    { id: "dp-5", value: 190, recordedFor: daysAgo(14), insertedBy: "Jordan Lee" },
    { id: "dp-6", value: 205, recordedFor: daysAgo(7), insertedBy: "Alex Rivera" },
  ],
};

export const monthlyRevenue: Kpi = {
  id: "kpi-revenue",
  name: "Monthly recurring revenue",
  unit: "$",
  cadence: "monthly",
  creator: "Priya Shah",
  dataPoints: [
    { id: "dp-r1", value: 42000, recordedFor: "2026-02-01", insertedBy: "Priya Shah" },
    { id: "dp-r2", value: 45500, recordedFor: "2026-03-01", insertedBy: "Priya Shah" },
    { id: "dp-r3", value: 44100, recordedFor: "2026-04-01", insertedBy: "Priya Shah" },
    { id: "dp-r4", value: 51200, recordedFor: "2026-05-01", insertedBy: "Priya Shah" },
    { id: "dp-r5", value: 58800, recordedFor: "2026-06-01", insertedBy: "Priya Shah" },
  ],
};

export const churnRate: Kpi = {
  id: "kpi-churn",
  name: "Monthly churn",
  unit: "%",
  cadence: "monthly",
  creator: "Priya Shah",
  dataPoints: [
    { id: "dp-c1", value: 4.1, recordedFor: "2026-04-01", insertedBy: "Priya Shah" },
    { id: "dp-c2", value: 3.6, recordedFor: "2026-05-01", insertedBy: "Priya Shah" },
    { id: "dp-c3", value: 3.9, recordedFor: "2026-06-01", insertedBy: "Priya Shah" },
  ],
};

/** A freshly created KPI with a single data point — exercises the chart edge case. */
export const singlePointKpi: Kpi = {
  id: "kpi-single",
  name: "NPS",
  unit: "pts",
  cadence: "monthly",
  creator: "Alex Rivera",
  dataPoints: [{ id: "dp-s1", value: 48, recordedFor: "2026-06-01", insertedBy: "Alex Rivera" }],
};

/** A KPI with no data points yet — exercises the "log your first data point" state. */
export const emptyKpi: Kpi = {
  id: "kpi-empty",
  name: "Support CSAT",
  unit: "%",
  cadence: "weekly",
  creator: "Jordan Lee",
  dataPoints: [],
};

export const allKpis: Kpi[] = [weeklySignups, monthlyRevenue, churnRate];
