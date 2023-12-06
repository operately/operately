import { gql, useQuery } from "@apollo/client";

const LIST_GOALS = gql`
  query ListGols($spaceId: ID!) {
    goals(spaceId: $spaceId) {
      id
      name
      insertedAt
      updatedAt
      isArchived
      timeframe
      champion {
        id
        fullName
        avatarUrl
        title
      }
      reviewer {
        id
        fullName
        avatarUrl
        title
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
