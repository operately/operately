import { gql, ApolloClient } from '@apollo/client';

const LIST_POTENTIAL_GROUP_MEMBERS = gql`
  query ListPotentialGroupMembers($groupId: ID!, $query: String!, $excludeIds: [ID!], $limit: Int) {
    potentialGroupMembers(groupId: $groupId, query: $query, excludeIds: $excludeIds, limit: $limit) {
      id
      fullName
      title
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

export function listPotentialGroupMembers(client : ApolloClient<object>, {variables} : ListPotentialGroupMembersParams) {
  return client.query({ query: LIST_POTENTIAL_GROUP_MEMBERS, variables })
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

export function setMission(client : ApolloClient<object>, {variables} : SetMissionParams) {
  return client.mutate({
    mutation: SET_MISSION,
    variables: variables
  })
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

export function addContact(client : ApolloClient<object>, {variables} : AddContactParams) {
  return client.mutate({
    mutation: ADD_CONTACT,
    variables: variables
  })
}
