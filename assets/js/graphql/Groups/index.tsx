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

const SET_MISSION = gql`
  mutation SetGroupMission($groupId: ID!, $mission: String!) {
    setGroupMission(groupId: $groupId, mission: $mission) {
      id
      mission
    }
  }
`;

export function listPotentialGroupMembers(client : ApolloClient, {variables} : ListPotentialGroupMembersParams) {
  return client.query({ query: LIST_POTENTIAL_GROUP_MEMBERS, variables })
}

export function setMission(client : ApolloClient, {variables}) {
  return client.mutate({
    mutation: SET_MISSION,
    variables: variables
  })
}
