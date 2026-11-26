import { useCallback, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { showErrorToast, type KpiGoalLinksProps, type SpaceKpisPageTypes } from "turboui";
import Api from "@/api";
import i18n from "@/i18n";
import { useQuerySearch } from "@/models/search/useQuerySearch";
import { usePaths } from "@/routes/paths";
import { useCompanyLoaderData } from "@/routes/useCompanyLoaderData";
import { assertPresent } from "@/utils/assertions";

const links = Api.kpi_goal_links;

function useLinksEnabled() {
  return !!useCompanyLoaderData().company.enabledExperimentalFeatures?.includes("work_map_v2");
}

function useSetKpiGoalLink() {
  const client = useQueryClient();

  return useMutation({
    ...links.setLinkMutationOptions(),
    onSuccess: () => client.invalidateQueries({ queryKey: Api.companies.listActivitiesQueryKeyPrefix() }),
    onError: () => showErrorToast(i18n.t("Error"), i18n.t("Couldn’t update the KPI link.")),
    onSettled: () =>
      Promise.all([
        client.invalidateQueries({ queryKey: links.forGoalQueryKeyPrefix() }),
        client.invalidateQueries({ queryKey: links.forKpiQueryKeyPrefix() }),
        client.invalidateQueries({ queryKey: links.searchKpisQueryKeyPrefix() }),
      ]),
  });
}

export function useKpiGoalLinks(goalId: string): KpiGoalLinksProps | false {
  const paths = usePaths();
  const enabled = useLinksEnabled();
  const [picker, setPicker] = useState<{ goalId: string; query: string } | null>(null);
  const query = picker?.goalId === goalId ? picker.query : undefined;
  const detail = useQuery({ ...links.forGoalQueryOptions({ goalId }), enabled });
  const canLink = detail.data?.canLink ?? false;
  const search = useQuery({
    ...links.searchKpisQueryOptions({ goalId, query: query ?? "" }),
    enabled: enabled && canLink && query !== undefined,
  });
  const save = useSetKpiGoalLink();

  if (!enabled) return false;

  return {
    items: detail.data?.items ?? [],
    href: (item) => {
      assertPresent(item.spaceId, "Linked KPI requires its space");
      return paths.spaceKpiPath(item.spaceId, item.id);
    },
    canLink,
    loading: detail.isLoading,
    error: detail.isError,
    retry: () => void detail.refetch(),
    saving: save.isPending,
    setLink: (kpiId, linked) => save.mutate({ goalId, kpiId, linked }, { onSuccess: () => setPicker(null) }),
    search: (text) => setPicker(text === null ? null : { goalId, query: text }),
    picker:
      query === undefined
        ? null
        : {
            query,
            items: search.data?.items ?? [],
            loading: search.isLoading,
            error: search.isError,
            retry: () => void search.refetch(),
          },
  };
}

export function useKpiGoalField(kpiId: string | undefined): SpaceKpisPageTypes.Props["goalLink"] {
  const enabled = useLinksEnabled() && !!kpiId;
  const paths = usePaths();
  const detail = useQuery({ ...links.forKpiQueryOptions({ kpiId: kpiId ?? "" }), enabled });
  const search = useQuerySearch(
    ({ query }: { query: string }) => links.searchGoalsQueryOptions({ kpiId: kpiId ?? "", query }),
    { query: "" },
  );
  const searchGoals = useCallback(
    async (params: { query: string }) => {
      try {
        const { items } = await search(params);
        return items.map(({ id, name, spaceName }) => ({ id, name, spaceName, link: paths.goalPath(id) }));
      } catch {
        showErrorToast(i18n.t("Error"), i18n.t("Something went wrong. Please try again."));
        return [];
      }
    },
    [search, paths],
  );
  const save = useSetKpiGoalLink();
  const current = detail.data?.goal;

  if (!enabled) return false;

  return {
    goal: current ? { id: current.id, name: current.name, link: paths.goalPath(current.id) } : null,
    readonly: save.isPending || !(current?.canUnlink || detail.data?.canLink),
    setGoal: (next) => {
      const goalId = next?.id ?? current?.id;
      if (goalId) save.mutate({ kpiId, goalId, linked: next !== null });
    },
    searchGoals,
    loading: detail.isLoading,
    error: detail.isError,
    retry: () => void detail.refetch(),
  };
}
