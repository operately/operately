import { useCallback } from "react";
import Api from "@/api";
import { useQuerySearch } from "@/models/search/useQuerySearch";

export function usePotentialSpaceMembersSearch(spaceId: string) {
  const search = useQuerySearch(
    (query: string) => Api.spaces.searchPotentialMembersQueryOptions({ spaceId, query }),
    "",
  );

  return useCallback(async (query: string) => (await search(query)).people ?? [], [search]);
}
