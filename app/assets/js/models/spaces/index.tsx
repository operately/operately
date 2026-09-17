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

export const searchPotentialSpaceMembers = Api.spaces.searchPotentialMembers;

interface SpaceSearchAttrs {
  accessLevel?: api.AccessOptions;
  ignoreIds?: string[];
  withTasksEnabledOnly?: boolean;
}

export function useSpaceSearch(attrs?: SpaceSearchAttrs): SpaceField.SearchSpaceFn {
  const paths = usePaths();

  return async ({ query }: { query: string }): Promise<SpaceField.Space[]> => {
    const data = await Api.spaces.search({
      query: query,
      accessLevel: attrs?.accessLevel,
      ignoredIds: attrs?.ignoreIds || [],
      withTasksEnabledOnly: attrs?.withTasksEnabledOnly,
    });

    return data.spaces.map((space) => ({
      id: space.id,
      name: space.name,
      link: paths.spacePath(space.id),
    }));
  };
}

export function parseSpaceForTurboUI(paths: Paths, space: api.Space) {
  return {
    id: space.id,
    name: space.name,
    link: paths.spacePath(space.id),
  };
}
