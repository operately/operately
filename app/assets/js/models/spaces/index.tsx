import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useQuerySearch } from "@/models/search/useQuerySearch";
import Api, * as api from "@/api";
import { SpaceField } from "turboui";
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

export function useEditableSpaces({ enabled }: { enabled: boolean }) {
  return useQuery({
    ...Api.spaces.searchQueryOptions({ query: "", accessLevel: "edit_access" }),
    select: (result) => result.spaces,
    enabled,
  });
}

export function useGetSpacePrivacy() {
  const client = useQueryClient();
  return useCallback(
    async (id: string) => {
      const { space } = await client.fetchQuery(
        Api.spaces.getQueryOptions({ id, includeAccessLevels: true, includePermissions: true }),
      );
      return space?.privateSpace ?? true;
    },
    [client],
  );
}

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
