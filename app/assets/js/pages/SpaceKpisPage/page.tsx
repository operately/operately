import * as React from "react";
import { Navigate } from "react-router";

import { SpaceKpisPage } from "turboui";
import type { SpaceKpisPage as SpaceKpisPageTypes } from "turboui/SpaceKpisPage/types";

import * as Companies from "@/models/companies";
import * as People from "@/models/people";
import * as Kpis from "@/models/kpis";

import { usePaths } from "@/routes/paths";
import { useCompanyLoaderData } from "@/routes/useCompanyLoaderData";
import { useLoadedData, useRefresh } from "./loader";

export function Page() {
  const paths = usePaths();
  const refresh = useRefresh();
  const { company } = useCompanyLoaderData();
  const { space, kpis } = useLoadedData();

  const peopleSearch = People.usePeopleSearch({ type: "space", id: space.id! });

  const [createKpi] = Kpis.useCreateKpi();
  const [editKpi] = Kpis.useEditKpi();
  const [deleteKpi] = Kpis.useDeleteKpi();
  const [logKpiEntry] = Kpis.useLogKpiEntry();

  const parsedKpis = React.useMemo(() => kpis.map((kpi) => Kpis.parseKpiForTurboUi(paths, kpi)), [kpis, paths]);

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

  const onDeleteKpi = async (kpiId: string) =>
    run(async () => {
      await deleteKpi({ kpiId });
      refresh();
    });

  const onRecordEntry = async (input: SpaceKpisPageTypes.RecordEntryInput) =>
    run(async () => {
      await logKpiEntry({ kpiId: input.kpiId, value: input.value, period: input.period });
      refresh();
    });

  const onLoadKpi = async (kpiId: string) => Kpis.parseKpiForTurboUi(paths, (await Kpis.getKpi({ kpiId })).kpi);

  return (
    <SpaceKpisPage
      space={{ id: space.id!, name: space.name!, link: paths.spacePath(space.id!) }}
      navigation={[{ to: paths.spacePath(space.id!), label: space.name! }]}
      kpis={parsedKpis}
      currentUser={null}
      canManage={space.permissions?.canEdit ?? false}
      championSearch={championSearch}
      onLoadKpi={onLoadKpi}
      onCreateKpi={onCreateKpi}
      onEditKpi={onEditKpi}
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
