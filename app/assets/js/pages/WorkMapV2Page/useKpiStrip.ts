import { useTranslation } from "react-i18next";
import { showErrorToast, type WorkMapV2PageProps } from "turboui";
import type { Company, Space } from "@/api";
import { useWorkMapKpiPins } from "@/models/workMap/useWorkMapKpiPins";
import { useEditableSpaces } from "@/models/spaces";
import { compareIds, usePaths } from "@/routes/paths";

export function useKpiStrip(
  company: Company,
  space: Space | undefined,
  canEdit: boolean,
  enabled: boolean,
): NonNullable<WorkMapV2PageProps["kpis"]> {
  const paths = usePaths();
  const { t } = useTranslation();
  const scope = space ? { spaceId: space.id } : {};
  const { pins, setSearch, results, save } = useWorkMapKpiPins(scope, enabled);
  const destinations = useEditableSpaces({ enabled: enabled && !space && pins.data?.hasKpis === false });
  const createSpace = space
    ? space.permissions?.canEdit
      ? space
      : undefined
    : (destinations.data?.find((s) => compareIds(s.id, company.companySpaceId)) ?? destinations.data?.[0]);

  return {
    pins: pins.data?.kpis ?? [],
    loading: pins.isPending,
    error: pins.isError,
    retry: () => void pins.refetch(),
    hasKpis: pins.data?.hasKpis ?? false,
    limit: pins.data?.pinLimit ?? 3,
    detailPath: (kpi) => paths.spaceKpiPath(kpi.spaceId, kpi.id),
    allPath: space ? paths.spaceKpisPath(space.id) : undefined,
    createPath: createSpace ? paths.spaceKpisPath(createSpace.id) + "?new=true" : undefined,
    search: setSearch,
    results: results.data?.kpis ?? [],
    searching: results.isPending,
    searchError: results.isError,
    retrySearch: () => void results.refetch(),
    hasMore: results.data?.hasMore ?? false,
    saving: save.isPending,
    save: canEdit
      ? (pinnedKpiIds) =>
          save.mutate(
            { ...scope, pinnedKpiIds },
            {
              onError: () => showErrorToast(t("Couldn’t save KPI pins"), t("Please try again.")),
            },
          )
      : undefined,
  };
}
