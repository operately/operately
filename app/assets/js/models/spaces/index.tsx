import * as api from "@/api";

export {
  listSpaceTools,
  searchPotentialSpaceMembers,
  useAddSpaceMembers,
  useCreateSpace,
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
