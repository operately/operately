import client from "@/graphql/client";
import { gql } from "@apollo/client";
import { Goal } from ".";

interface GetGoalsOptions {
  spaceId?: string;
  includeTargets?: boolean;
  includeSpace?: boolean;
}

export async function getGoals(options: GetGoalsOptions = {}): Promise<Goal[]> {
  const data = await client.query({
    query: LIST_GOALS,
    variables: {
      spaceId: options.spaceId,
      includeTargets: !!options.includeTargets,
      includeSpace: !!options.includeSpace,
    },
    fetchPolicy: "network-only",
  });

  return data.data.goals;
}

const LIST_GOALS = gql`
  fragment Targets on Goal {
    targets {
      name
      from
      to
      value
    }
  }

  fragment GoalSpace on Goal {
    space {
      id
      name
    }
  }

  query ListGols($spaceId: ID, $includeTargets: Boolean!, $includeSpace: Boolean!) {
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

      ...GoalSpace @include(if: $includeSpace)
      ...Targets @include(if: $includeTargets)
    }
  }
`;
