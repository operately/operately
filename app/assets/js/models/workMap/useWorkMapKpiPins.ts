import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Api, { type WorkMapsGetKpiPinsInput } from "@/api";

export function useWorkMapKpiPins(scope: WorkMapsGetKpiPinsInput, enabled: boolean) {
  const client = useQueryClient();
  const pins = useQuery({ ...Api.work_maps.getKpiPinsQueryOptions(scope), enabled });
  const [search, setSearch] = useState<{ query: string; offset: number } | null>(null);
  const results = useQuery({
    ...Api.work_maps.searchKpisQueryOptions({ ...scope, ...search }),
    enabled: enabled && search !== null,
  });
  const save = useMutation({
    ...Api.work_maps.saveLayoutAndHierarchyMutationOptions(),
    onSettled: () => client.invalidateQueries({ queryKey: Api.work_maps.getKpiPinsQueryKey(scope) }),
  });

  return { pins, setSearch, results, save };
}
