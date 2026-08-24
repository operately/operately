import type { Kpi as ApiKpi } from "@/api";
import { Paths } from "@/routes/paths";
import { parseKpiForTurboUi } from ".";

function kpi(period: string): ApiKpi {
  return {
    __typename: "kpi",
    id: "kpi-1",
    spaceId: "space-1",
    name: "Monthly Recurring Revenue",
    unit: "USD",
    cadence: "monthly",
    champion: null,
    insertedAt: "2026-07-01T12:00:00.000Z",
    latestEntry: null,
    entries: [
      {
        __typename: "kpi_entry",
        id: "entry-1",
        value: 1385000,
        period,
        recordedBy: null,
      },
    ],
  };
}

describe("parseKpiForTurboUi", () => {
  const paths = new Paths({ companyId: "acme" });

  // `period` is a calendar date, not an instant. Reading it as midnight UTC
  // would show the previous day to anyone west of UTC, so it has to land on the
  // same calendar day in local time.
  test("keeps an entry's period on its own calendar day", () => {
    const [entry] = parseKpiForTurboUi(paths, kpi("2026-07-29")).entries;

    expect(entry?.recordedAt.getFullYear()).toBe(2026);
    expect(entry?.recordedAt.getMonth()).toBe(6);
    expect(entry?.recordedAt.getDate()).toBe(29);
  });
});
