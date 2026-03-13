import Api, * as api from "@/api";
import { SpaceField } from "turboui/src/SpaceField";
import { Paths, usePaths } from "../../routes/paths";

export type { Space, SpaceTools } from "@/api";

export const listSpaceTools = Api.spaces.listTools;
export const searchPotentialSpaceMembers = Api.spaces.searchPotentialMembers;
export const useAddSpaceMembers = Api.spaces.useAddMembers;
export const useCreateSpace = Api.spaces.useCreate;
export const useDeleteSpace = Api.spaces.useDelete;
export const useEditSpace = Api.spaces.useUpdate;
export const useEditSpaceMembersPermissions = Api.spaces.useUpdateMembersPermissions;
export const useEditSpacePermissions = Api.spaces.useUpdatePermissions;
export const useJoinSpace = Api.spaces.useJoin;
export const useRemoveGroupMember = Api.spaces.useDeleteMember;

export async function getSpace(params: api.SpacesGetInput): Promise<api.Space> {
  return await Api.spaces.get(params).then((res) => res.space!);
}

export async function getSpaces(params: api.SpacesListInput): Promise<api.Space[]> {
  return await Api.spaces.list(params).then((res) => res.spaces!);
}

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
