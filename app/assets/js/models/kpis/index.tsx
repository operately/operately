import Api, { Kpi as ApiKpi, KpiEntry as ApiKpiEntry } from "@/api";
import { Paths } from "@/routes/paths";
import { parsePersonForTurboUi } from "@/models/people";
import type { SpaceKpisPage } from "turboui/SpaceKpisPage/types";

export type { Kpi } from "@/api";

export const listKpis = Api.kpis.listKpis;
export const getKpi = Api.kpis.getKpi;
export const useCreateKpi = Api.kpis.useCreateKpi;
export const useEditKpi = Api.kpis.useEditKpi;
export const useDeleteKpi = Api.kpis.useDeleteKpi;
export const useLogKpiEntry = Api.kpis.useLogKpiEntry;
export const useSubscribeToKpi = Api.kpis.useSubscribeToKpi;
export const useUnsubscribeFromKpi = Api.kpis.useUnsubscribeFromKpi;

// Map the API KPI shape onto the presentational turboui shape. The `period` /
// timestamps arrive as ISO strings and are parsed into `Date`s for the chart.
// `currentUserId` is used to derive the current user's subscription state from
// the KPI's subscription list (only present on the detail payload).
export function parseKpiForTurboUi(paths: Paths, kpi: ApiKpi, currentUserId?: string | null): SpaceKpisPage.Kpi {
  return {
    id: kpi.id,
    name: kpi.name,
    unit: kpi.unit,
    cadence: kpi.cadence as SpaceKpisPage.Cadence,
    champion: parsePersonForTurboUi(paths, kpi.champion),
    insertedAt: kpi.insertedAt ? new Date(kpi.insertedAt) : new Date(),
    latestEntry: kpi.latestEntry ? parseKpiEntryForTurboUi(paths, kpi.latestEntry) : null,
    entries: (kpi.entries ?? []).map((entry) => parseKpiEntryForTurboUi(paths, entry)),
    isSubscribed: isCurrentUserSubscribed(kpi, currentUserId),
  };
}

function isCurrentUserSubscribed(kpi: ApiKpi, currentUserId?: string | null): boolean | undefined {
  if (!kpi.subscriptionList || !currentUserId) return undefined;

  return (kpi.subscriptionList.subscriptions ?? []).some((sub) => !sub.canceled && sub.person?.id === currentUserId);
}

function parseKpiEntryForTurboUi(paths: Paths, entry: ApiKpiEntry): SpaceKpisPage.KpiEntry {
  return {
    id: entry.id,
    value: entry.value,
    recordedAt: new Date(entry.period),
    recordedBy: parsePersonForTurboUi(paths, entry.recordedBy),
  };
}
