import { gql, useMutation, ApolloClient } from "@apollo/client";

export type { Group } from "@/gql";

export const GET_GROUP = gql`
  query GetGroup($id: ID!) {
    group(id: $id) {
      id
      name
      mission
      icon
      color

      members {
        id
        fullName
        avatarUrl
        title
      }

      pointsOfContact {
        id
        name
        type
        value
      }
    }
  }
`;

const CREATE_GROUP = gql`
  mutation CreateGroup($input: CreateGroupInput!) {
    createGroup(input: $input) {
      id
      name
    }
  }
`;

export function useCreateGroup(options = {}) {
  return useMutation(CREATE_GROUP, options);
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

export function listPotentialGroupMembers(
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
    removeGroupMember(groupId: $groupId, memberId: $memberId) {
      id
    }
  }
`;

export function useRemoveMemberFromGroup(options = {}) {
  return useMutation(REMOVE_GROUP_MEMBER, options);
}

export const ADD_MEMBERS = gql`
  mutation AddGroupMembers($groupId: ID!, $personIds: [ID!]!) {
    addGroupMembers(groupId: $groupId, personIds: $personIds) {
      id
    }
  }
`;

const UPDATE_GROUP_APPEARANCE = gql`
  mutation UpdateGroupAppearance($input: UpdateGroupAppearanceInput!) {
    updateGroupAppearance(input: $input) {
      id
    }
  }
`;

export function useUpdateGroupAppearanceMutation(options = {}) {
  return useMutation(UPDATE_GROUP_APPEARANCE, options);
}
