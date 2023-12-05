import { gql, useQuery } from "@apollo/client";

const LIST_GOALS = gql`
  fragment ContributorFields on Contributor {
  }

  query ListGols($spaceId: ID!) {
    goals(spaceId: $spaceId) {
      id
      name
      insertedAt
      updatedAt
      private
      isArchived
      contributors {
        id
        role
        insertedAt
        updatedAt

        person {
          id
          name
          email
          avatarUrl
        }
      }
    }
  }
`;

export function useGoals(spaceId: string) {
  return useQuery(LIST_GOALS, {
    variables: {
      spaceId: spaceId,
    },
    fetchPolicy: "network-only",
  });
}
