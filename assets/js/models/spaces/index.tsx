import * as api from "@/api";

export type { Space } from "@/api";
export {
  useCreateGroup,
  useJoinSpace,
  useEditGroup,
  useRemoveGroupMember,
  useAddGroupMembers,
  useUpdateGroupAppearance,
  useEditSpaceMembersPermissions,
  searchPotentialSpaceMembers,
} from "@/api";

export async function getSpace(params: api.GetSpaceInput): Promise<api.Space> {
  return await api.getSpace(params).then((res) => res.space!);
}

export async function getSpaces(params: api.GetSpacesInput): Promise<api.Space[]> {
  return await api.getSpaces(params).then((res) => res.spaces!);
}

export function sortSpaces(groups: any[]) {
  return [...groups].sort((a, b) => {
    if (a.isCompanySpace) return -100;
    if (b.isCompanySpace) return 100;

    return a.name.localeCompare(b.name);
  });
}
