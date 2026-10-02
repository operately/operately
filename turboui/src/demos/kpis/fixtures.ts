import type { SpaceKpisPage as KPI } from "../../SpaceKpisPage/types";
import { assertPresent } from "../../utils/assertions";
import type { KpiDemoFixtures, KpiDemoFixtureOptions, KpiDemoPerson, KpiDemoComment } from "./types";

/** Each call creates independent data, with calendar dates relative to the supplied day. */
export function createKpiDemoFixtures(options: KpiDemoFixtureOptions = {}): KpiDemoFixtures {
  const today = options.referenceDate ?? new Date();
  const kpisLink = options.kpisLink ?? "/spaces/space-growth/kpis";
  const space = { id: "space-growth", name: "Growth", link: kpisLink };
  const people: KpiDemoPerson[] = [
    "Maya Chen",
    "Alex Rivera",
    "Sam Taylor",
    "Priya Patel",
    "Jordan Lee",
    "Casey Morgan",
  ].map((fullName, index) => ({
    id: `person-${index + 1}`,
    fullName,
    avatarUrl: null,
    title: "Team member",
    profileLink: kpisLink,
  }));
  const [maya, alex, sam, priya] = people;
  assertPresent(maya);
  assertPresent(alex);
  assertPresent(sam);
  assertPresent(priya);
  const asRichText = (text: string) => ({
    type: "doc",
    content: [{ type: "paragraph", content: [{ type: "text", text }] }],
  });
  function daysAgo(n: number): Date {
    const date = new Date(today);
    date.setDate(date.getDate() - n);
    date.setHours(12, 0, 0, 0);
    return date;
  }

  function makeEntries(
    samples: {
      value: number;
      daysAgo: number;
      by: KPI.Person | null;
      edits?: KPI.KpiEntryEdit[];
    }[],
  ): KPI.KpiEntry[] {
    return samples
      .map((sample, index) => ({
        id: `entry-${index}-${sample.daysAgo}`,
        value: sample.value,
        recordedAt: daysAgo(sample.daysAgo),
        recordedBy: sample.by,
        commentsCount: 0,
        edits: sample.edits ?? [],
      }))
      .sort((a, b) => a.recordedAt.getTime() - b.recordedAt.getTime());
  }

  function makeAnnotations(samples: { title: string; daysAgo: number; by: KPI.Person | null }[]): KPI.KpiAnnotation[] {
    return samples
      .map((sample, index) => ({
        id: `annotation-${index}-${sample.daysAgo}`,
        title: sample.title,
        date: daysAgo(sample.daysAgo),
        createdBy: sample.by,
      }))
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  // Mirrors the backend: the list endpoint provides `latestEntry` alongside the
  // (here fully-populated) history, so stories render latest values consistently.
  // The permalink matches the app's route: /spaces/:spaceId/kpis/:kpiId.
  function withLatestEntryAndLink(kpi: Omit<KPI.Kpi, "latestEntry" | "link">): KPI.Kpi {
    const entries = kpi.entries.map((entry) => ({ ...entry, id: `${kpi.id}-${entry.id}` }));
    return {
      ...kpi,
      entries,
      annotations: kpi.annotations.map((annotation) => ({ ...annotation, id: `${kpi.id}-${annotation.id}` })),
      link: `${kpisLink}/${kpi.id}`,
      latestEntry: entries.at(-1) ?? null,
    };
  }

  let kpis: KPI.Kpi[] = (
    [
      {
        id: "kpi-mrr",
        name: "Monthly Recurring Revenue",
        description: asRichText("Tracks recurring revenue from active subscriptions at the end of each month."),
        unit: "USD",
        cadence: "monthly",
        champion: alex,
        insertedAt: daysAgo(180),
        entries: makeEntries([
          { value: 820000, daysAgo: 150, by: alex },
          { value: 910000, daysAgo: 120, by: alex },
          { value: 985000, daysAgo: 90, by: alex },
          { value: 1120000, daysAgo: 60, by: sam },
          { value: 1240000, daysAgo: 30, by: alex },
          {
            value: 1385000,
            daysAgo: 2,
            by: alex,
            edits: [
              {
                id: "edit-mrr-latest",
                previousValue: 1320000,
                previousPeriod: daysAgo(2),
                editedBy: alex,
                editedAt: daysAgo(1),
              },
            ],
          },
        ]),
        annotations: makeAnnotations([
          { title: "Launched enterprise plan", daysAgo: 90, by: alex },
          { title: "Raised starter pricing", daysAgo: 45, by: sam },
        ]),
      },
      {
        id: "kpi-nps",
        name: "Net Promoter Score",
        description: null,
        unit: "NPS",
        cadence: "monthly",
        champion: sam,
        insertedAt: daysAgo(120),
        annotations: [],
        entries: makeEntries([
          { value: 32, daysAgo: 90, by: sam },
          { value: 41, daysAgo: 60, by: sam },
          { value: 38, daysAgo: 30, by: priya },
          { value: 47, daysAgo: 1, by: sam },
        ]),
      },
      {
        id: "kpi-uptime",
        name: "Service Uptime",
        description: null,
        unit: "%",
        cadence: "weekly",
        champion: priya,
        insertedAt: daysAgo(70),
        annotations: [],
        entries: makeEntries([
          { value: 99.92, daysAgo: 28, by: priya },
          { value: 99.97, daysAgo: 21, by: priya },
          { value: 99.81, daysAgo: 14, by: priya },
          { value: 99.99, daysAgo: 7, by: priya },
          { value: 100, daysAgo: 0, by: priya },
        ]),
      },
      {
        id: "kpi-signups",
        name: "Weekly Sign-ups",
        description: null,
        unit: "users",
        cadence: "weekly",
        champion: null,
        insertedAt: daysAgo(14),
        annotations: [],
        // Single entry — exercises the "not enough data to plot a trend" edge case.
        entries: makeEntries([{ value: 340, daysAgo: 3, by: maya }]),
      },
      {
        id: "kpi-churn",
        name: "Logo Churn",
        description: null,
        unit: "%",
        cadence: "monthly",
        champion: maya,
        insertedAt: daysAgo(5),
        annotations: [],
        // No entries yet — exercises the empty chart / "No data" states.
        entries: [],
      },
    ] as Omit<KPI.Kpi, "latestEntry" | "link">[]
  ).map(withLatestEntryAndLink);

  if (options.scenario === "empty") kpis = [];
  if (options.scenario === "single-entry") kpis = kpis.filter((kpi) => kpi.id === "kpi-signups");
  const comments: Record<string, KpiDemoComment[]> = {};
  const latest = kpis.find((kpi) => kpi.id === "kpi-mrr")?.latestEntry;
  if (latest) {
    latest.commentsCount = 1;
    comments[latest.id] = [
      {
        type: "comment",
        value: {
          id: "comment-mrr-note",
          author: maya,
          insertedAt: latest.recordedAt.toISOString(),
          content: JSON.stringify(asRichText("Enterprise subscriptions accounted for most of this month's increase.")),
          reactions: [{ id: "reaction-mrr-note", emoji: "🎉", person: alex }],
        },
      },
    ];
  }
  return {
    people,
    currentUser: maya,
    space,
    kpisLink,
    kpis,
    comments,
    subscriptions: Object.fromEntries(kpis.map((kpi) => [kpi.id, true])),
  };
}
