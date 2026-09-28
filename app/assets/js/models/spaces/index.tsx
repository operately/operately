import { useCallback } from "react";
import { useQuerySearch } from "@/models/search/useQuerySearch";
import Api, * as api from "@/api";
import { SpaceField } from "turboui/src/SpaceField";
import { Paths, usePaths } from "../../routes/paths";

export { invalidateSpaceTaskQueries, useUpdateSpaceKanban, useUpdateSpaceTaskStatuses } from "./spaceTaskLifecycle";
export {
  invalidateSpaceLifecycleQueries,
  invalidateSpaceToolsQueries,
  useCreateSpace,
  useDeleteSpace,
  useEditSpace,
  useUpdateSpaceTools,
} from "./spaceLifecycle";

export type { Space, SpaceTools } from "@/api";

export {
  invalidateSpaceAccessQueries,
  useAddSpaceMembers,
  useJoinSpace,
  useRemoveGroupMember,
  useEditSpaceMembersPermissions,
  useEditSpacePermissions,
} from "./spaceAccessLifecycle";

export { usePotentialSpaceMembersSearch } from "./usePotentialSpaceMembersSearch";

interface SpaceSearchAttrs {
  accessLevel?: api.AccessOptions;
  ignoreIds?: string[];
  withTasksEnabledOnly?: boolean;
}

export function useSpaceSearch(attrs?: SpaceSearchAttrs): SpaceField.SearchSpaceFn {
  const paths = usePaths();

  const search = useQuerySearch(
    ({ query }: { query: string }) =>
      Api.spaces.searchQueryOptions({
        query: query,
        accessLevel: attrs?.accessLevel,
        ignoredIds: attrs?.ignoreIds || [],
        withTasksEnabledOnly: attrs?.withTasksEnabledOnly,
      }),
    { query: "" },
  );

  return useCallback(
    async ({ query }: { query: string }) => {
      const data = await search({ query });

      return data.spaces.map((space) => ({
        id: space.id,
        name: space.name,
        link: paths.spacePath(space.id),
      }));
    },
    [search, paths],
  );
}

export function parseSpaceForTurboUI(paths: Paths, space: api.Space) {
  return {
    id: space.id,
    name: space.name,
    link: paths.spacePath(space.id),
  };
}
