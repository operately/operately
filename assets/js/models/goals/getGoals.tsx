import client from "@/graphql/client";
import { gql } from "@apollo/client";

const LIST_GOALS = gql`
  fragment Targets on Goal {
    targets {
      name
    }
  }

  query ListGols($spaceId: ID!, $includeTargets: Boolean!) {
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

      ...Targets @include(if: $includeTargets)
    }
  }
`;

interface GetGoalsOptions {
  includeTargets?: boolean;
}

export async function getGoals(spaceId: string, options: GetGoalsOptions = {}): Promise<Goals.Goal[]> {
  const data = await client.query({
    query: LIST_GOALS,
    variables: {
      spaceId: spaceId,
      includeTargets: options.includeTargets,
    },
    fetchPolicy: "network-only",
  });

  return data.data.goals;
}
