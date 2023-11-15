import { gql, useMutation, ApolloClient } from "@apollo/client";

export interface PointOfContact {
  id: string;
  name: string;
  type: string;
  value: string;
}

export interface Group {
  id: string;
  name: string;
  mission: string;
  members: Person[];
  pointsOfContact: PointOfContact[];

  privateSpace: boolean;
  icon: string;
  color: string;
}

interface Person {
  id: string;
  fullName: string;
  avatarUrl?: string;
}

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

export const CREATE_GROUP = gql`
  mutation CreateGroup($name: String!, $mission: String!) {
    createGroup(name: $name, mission: $mission) {
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

const SET_MISSION = gql`
  mutation SetGroupMission($groupId: ID!, $mission: String!) {
    setGroupMission(groupId: $groupId, mission: $mission) {
      id
      mission
    }
  }
`;

interface SetMissionParams {
  variables: {
    groupId: string;
    mission: string;
  };
}

export function setMission(client: ApolloClient<object>, { variables }: SetMissionParams) {
  return client.mutate({
    mutation: SET_MISSION,
    variables: variables,
  });
}

const ADD_CONTACT = gql`
  mutation AddGroupContact($groupId: ID!, $contact: ContactInput!) {
    addGroupContact(groupId: $groupId, contact: $contact) {
      id
    }
  }
`;

interface ContactInput {
  type?: string;
  name?: string;
  value?: string;
}

interface AddContactParams {
  variables: {
    groupId: string;
    contact: ContactInput;
  };
}

export function addContact(client: ApolloClient<object>, { variables }: AddContactParams) {
  return client.mutate({
    mutation: ADD_CONTACT,
    variables: variables,
  });
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

export const REMOVE_GROUP_MEMBER = gql`
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
