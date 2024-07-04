import * as api from "@/api";
import { gql, useMutation, ApolloClient } from "@apollo/client";

export type { Space } from "@/api";
export { useCreateGroup, useJoinSpace, useEditGroup } from "@/api";

export { useEditSpaceMutation } from "./useEditSpaceMutation";

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

const LIST_POTENTIAL_GROUP_MEMBERS = gql`
  query ListPotentialGroupMembers($groupId: ID!, $query: String!, $excludeIds: [ID!], $limit: Int) {
    potentialGroupMembers(groupId: $groupId, query: $query, excludeIds: $excludeIds, limit: $limit) {
      id
      fullName
      title
      avatarUrl
    }
  }
`;

interface ListPotentialGroupMembersParams {
  variables: {
    groupId: string;
    query: string;
    excludeIds: string[];
    limit: number;
  };
}

export function listPotentialSpaceMembers(
  client: ApolloClient<object>,
  { variables }: ListPotentialGroupMembersParams,
) {
  return client.query({ query: LIST_POTENTIAL_GROUP_MEMBERS, variables });
}

export const LIST_GROUPS = gql`
  query ListGroups {
    groups {
      id
      name
      mission
      icon
      color
    }
  }
`;

const REMOVE_GROUP_MEMBER = gql`
  mutation RemoveGroupMember($groupId: ID!, $memberId: ID!) {
    removeGroupMember(groupId: $groupId, memberId: $memberId)
  }
`;

export function useRemoveMemberFromSpace(options = {}) {
  return useMutation(REMOVE_GROUP_MEMBER, options);
}

export const ADD_MEMBERS = gql`
  mutation AddGroupMembers($groupId: ID!, $members: [AddMemberInput]!) {
    addGroupMembers(groupId: $groupId, members: $members)
  }
`;

const UPDATE_GROUP_APPEARANCE = gql`
  mutation UpdateGroupAppearance($input: UpdateGroupAppearanceInput!) {
    updateGroupAppearance(input: $input) {
      id
    }
  }
`;

export function useUpdateSpaceAppearanceMutation(options = {}) {
  return useMutation(UPDATE_GROUP_APPEARANCE, options);
}
