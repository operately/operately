import { genPeople } from "../utils/storybook/genPeople";
import type { SpaceKpisPage } from "./types";

const people = genPeople(6);
const [alice, bob, carol, dave] = people;

export const mockPeople: SpaceKpisPage.Person[] = people;

export const mockSpace: SpaceKpisPage.Space = {
  id: "space-growth",
  name: "Growth",
  link: "#",
};

export const mockCurrentUser: SpaceKpisPage.Person = alice!;

// Search fn backing the champion picker in the "New KPI" form.
export const mockChampionSearch = async (query: string): Promise<SpaceKpisPage.Person[]> => {
  if (!query) return mockPeople;
  return mockPeople.filter((p) => p.fullName.toLowerCase().includes(query.toLowerCase()));
};

const DAY = 24 * 60 * 60 * 1000;

// `today` in the POC's frozen timeline so stories are deterministic.
const today = new Date("2026-07-31T12:00:00Z");

function daysAgo(n: number): Date {
  return new Date(today.getTime() - n * DAY);
}

function makeEntries(
  samples: { value: number; daysAgo: number; by: SpaceKpisPage.Person | null }[],
): SpaceKpisPage.KpiEntry[] {
  return samples
    .map((sample, index) => ({
      id: `entry-${index}-${sample.daysAgo}`,
      value: sample.value,
      recordedAt: daysAgo(sample.daysAgo),
      recordedBy: sample.by,
    }))
    .sort((a, b) => a.recordedAt.getTime() - b.recordedAt.getTime());
}

// Mirrors the backend: the list endpoint provides `latestEntry` alongside the
// (here fully-populated) history, so stories render latest values consistently.
function withLatestEntry(kpi: Omit<SpaceKpisPage.Kpi, "latestEntry">): SpaceKpisPage.Kpi {
  return {
    ...kpi,
    latestEntry: kpi.entries.length > 0 ? kpi.entries[kpi.entries.length - 1]! : null,
  };
}

export const mockKpis: SpaceKpisPage.Kpi[] = ([
  {
    id: "kpi-mrr",
    name: "Monthly Recurring Revenue",
    unit: "USD",
    cadence: "monthly",
    champion: bob!,
    insertedAt: daysAgo(180),
    entries: makeEntries([
      { value: 820000, daysAgo: 150, by: bob! },
      { value: 910000, daysAgo: 120, by: bob! },
      { value: 985000, daysAgo: 90, by: bob! },
      { value: 1120000, daysAgo: 60, by: carol! },
      { value: 1240000, daysAgo: 30, by: bob! },
      { value: 1385000, daysAgo: 2, by: bob! },
    ]),
  },
  {
    id: "kpi-nps",
    name: "Net Promoter Score",
    unit: "NPS",
    cadence: "monthly",
    champion: carol!,
    insertedAt: daysAgo(120),
    entries: makeEntries([
      { value: 32, daysAgo: 90, by: carol! },
      { value: 41, daysAgo: 60, by: carol! },
      { value: 38, daysAgo: 30, by: dave! },
      { value: 47, daysAgo: 1, by: carol! },
    ]),
  },
  {
    id: "kpi-uptime",
    name: "Service Uptime",
    unit: "%",
    cadence: "weekly",
    champion: dave!,
    insertedAt: daysAgo(70),
    entries: makeEntries([
      { value: 99.92, daysAgo: 28, by: dave! },
      { value: 99.97, daysAgo: 21, by: dave! },
      { value: 99.81, daysAgo: 14, by: dave! },
      { value: 99.99, daysAgo: 7, by: dave! },
      { value: 100, daysAgo: 0, by: dave! },
    ]),
  },
  {
    id: "kpi-signups",
    name: "Weekly Sign-ups",
    unit: "users",
    cadence: "weekly",
    champion: null,
    insertedAt: daysAgo(14),
    // Single entry — exercises the "not enough data to plot a trend" edge case.
    entries: makeEntries([{ value: 340, daysAgo: 3, by: alice! }]),
  },
  {
    id: "kpi-churn",
    name: "Logo Churn",
    unit: "%",
    cadence: "monthly",
    champion: alice!,
    insertedAt: daysAgo(5),
    // No entries yet — exercises the empty chart / "No data" states.
    entries: [],
  },
] as Omit<SpaceKpisPage.Kpi, "latestEntry">[]).map(withLatestEntry);

// A trimmed set of KPIs used by the KpiSummaryCard stories to show a mix of
// trends within a single space: rising (MRR), volatile (NPS), and a brand-new
// KPI with no data yet (Logo Churn).
export const mockSummaryKpis: SpaceKpisPage.Kpi[] = [
  mockKpis[0]!, // Monthly Recurring Revenue — steady upward trend
  mockKpis[1]!, // Net Promoter Score — up-and-down
  mockKpis[3]!, // Weekly Sign-ups — single entry, no trend line yet
  mockKpis[4]!, // Logo Churn — no entries, "No data" row
];

// A single KPI, for the summary card's single-KPI story.
export const mockSingleKpi: SpaceKpisPage.Kpi[] = [mockKpis[2]!]; // Service Uptime
