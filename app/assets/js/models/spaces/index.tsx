import Api, * as api from "@/api";
import { SpaceField } from "turboui/src/SpaceField";
import { Paths, usePaths } from "../../routes/paths";

export {
  listSpaceTools,
  searchPotentialSpaceMembers,
  useAddSpaceMembers,
  useCreateSpace,
  useDeleteSpace,
  useEditSpace,
  useEditSpaceMembersPermissions,
  useEditSpacePermissions,
  useJoinSpace,
  useRemoveGroupMember,
  useSearchPotentialSpaceMembers,
} from "@/api";

export type { Space, SpaceTools } from "@/api";

export async function getSpace(params: api.GetSpaceInput): Promise<api.Space> {
  return await api.getSpace(params).then((res) => res.space!);
}

export async function getSpaces(params: api.GetSpacesInput): Promise<api.Space[]> {
  return await api.getSpaces(params).then((res) => res.spaces!);
}

export function useSpaceSearch(): SpaceField.SearchSpaceFn {
  const paths = usePaths();

  return async ({ query }: { query: string }): Promise<SpaceField.Space[]> => {
    const data = await Api.spaces.search({ query: query });

    return data.spaces.map((space) => ({
      id: space.id!,
      name: space.name!,
      link: paths.spacePath(space.id!),
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
