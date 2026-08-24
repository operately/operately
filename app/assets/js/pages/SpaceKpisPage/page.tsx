import * as React from "react";
import { Navigate, useNavigate } from "react-router";

import { showErrorToast, SpaceKpisPage } from "turboui";
import type { SpaceKpisPage as SpaceKpisPageTypes } from "turboui/SpaceKpisPage/types";

import * as Companies from "@/models/companies";
import * as People from "@/models/people";
import * as Kpis from "@/models/kpis";
import { useSubscription } from "@/models/subscriptions";

import { useRichEditorHandlers } from "@/hooks/useRichEditorHandlers";
import { usePaths } from "@/routes/paths";
import { useCompanyLoaderData } from "@/routes/useCompanyLoaderData";
import { useLoadedData, useRefresh } from "./loader";

export function Page() {
  const paths = usePaths();
  const navigate = useNavigate();
  const refresh = useRefresh();
  const { company } = useCompanyLoaderData();
  const { space, kpis, kpi } = useLoadedData();

  const peopleSearch = People.usePeopleSearch({ type: "space", id: space.id! });
  const richTextHandlers = useRichEditorHandlers({ scope: { type: "space", id: space.id! } });

  const [createKpi] = Kpis.useCreateKpi();
  const [editKpi] = Kpis.useEditKpi();
  const [deleteKpi] = Kpis.useDeleteKpi();
  const [logKpiEntry] = Kpis.useLogKpiEntry();

  const kpisLink = paths.spaceKpisPath(space.id!);
  const parsedKpis = React.useMemo(() => kpis.map((k) => Kpis.parseKpiForTurboUi(paths, k)), [kpis, paths]);
  const selectedKpi = React.useMemo(() => (kpi ? Kpis.parseKpiForTurboUi(paths, kpi) : null), [kpi, paths]);
  const subscriptions = useSubscription({
    subscriptionList: kpi?.subscriptionList,
    entityId: kpi?.id ?? "",
    entityType: "kpi",
    cacheKey: `v1-SpaceKpisPage-${space.id}-${kpi?.id ?? "list"}`,
    onRefresh: refresh,
  });

  const championSearch = React.useCallback(
    async (query: string) => People.parsePeopleForTurboUi(paths, await peopleSearch(query)),
    [paths, peopleSearch],
  );

  // The KPIs tool is gated behind the company experimental feature. If it is
  // off the route is not linked anywhere; a direct visit falls back to the
  // space page rather than rendering an unsupported tool.
  if (!Companies.hasFeature(company, "space_kpis")) {
    return <Navigate to={paths.spacePath(space.id!)} replace />;
  }

  const onCreateKpi = async (input: SpaceKpisPageTypes.NewKpiInput) =>
    run(async () => {
      const res = await createKpi({
        spaceId: space.id!,
        name: input.name,
        unit: input.unit,
        cadence: input.cadence,
        championId: input.championId,
      });
      refresh();
      return res.kpi.id;
    });

  const onEditKpi = async (input: SpaceKpisPageTypes.EditKpiInput) =>
    run(async () => {
      await editKpi({
        kpiId: input.id,
        name: input.name,
        unit: input.unit,
        cadence: input.cadence,
        championId: input.championId,
      });
      refresh();
      return input.id;
    });

  const onDescriptionChange = async (kpiId: string, description: Record<string, unknown>) => {
    const result = await run(async () => {
      await editKpi({ kpiId, description: JSON.stringify(description) });
      refresh();
      return kpiId;
    });

    if (!result.success) {
      showErrorToast("Error", "Failed to update KPI description.");
    }

    return result.success;
  };

  // Deleting the KPI whose page we are on leaves nothing to show, so we return
  // to the list instead of refreshing into a missing KPI.
  const onDeleteKpi = async (kpiId: string) =>
    run(async () => {
      await deleteKpi({ kpiId });
      if (kpiId === selectedKpi?.id) navigate(kpisLink);
      else refresh();
    });

  const onRecordEntry = async (input: SpaceKpisPageTypes.RecordEntryInput) =>
    run(async () => {
      await logKpiEntry({ kpiId: input.kpiId, value: input.value, period: input.period });
      refresh();
    });

  return (
    <SpaceKpisPage
      space={{ id: space.id!, name: space.name!, link: paths.spacePath(space.id!) }}
      navigation={[{ to: paths.spacePath(space.id!), label: space.name! }]}
      kpisLink={kpisLink}
      kpis={parsedKpis}
      selectedKpi={selectedKpi}
      currentUser={null}
      canManage={space.permissions?.canEdit ?? false}
      subscriptions={subscriptions}
      championSearch={championSearch}
      richTextHandlers={richTextHandlers}
      onCreateKpi={onCreateKpi}
      onEditKpi={onEditKpi}
      onDescriptionChange={onDescriptionChange}
      onDeleteKpi={onDeleteKpi}
      onRecordEntry={onRecordEntry}
    />
  );
}

// Adapt a mutation promise to the turboui { success, id?, error? } contract so
// forms can surface inline errors instead of throwing.
async function run(fn: () => Promise<string | void>): Promise<SpaceKpisPageTypes.MutationResult> {
  try {
    const id = await fn();
    return { success: true, id: id ?? undefined };
  } catch (error: any) {
    return { success: false, error: error?.message ?? "Something went wrong. Please try again." };
  }
}
