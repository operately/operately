import { gql } from '@apollo/client';

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

export function listPotentialGroupMembers(client, {variables} : ListPotentialGroupMembersParams) {
  console.log("listPotentialGroupMembers", variables)
  return client.query({ query: LIST_POTENTIAL_GROUP_MEMBERS, variables })
}
