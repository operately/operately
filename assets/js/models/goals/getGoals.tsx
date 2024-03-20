import client from "@/graphql/client";
import { gql } from "@apollo/client";
import { Goal } from ".";

interface GetGoalsOptions {
  spaceId?: string;
  includeTargets?: boolean;
  includeSpace?: boolean;
  timeframe?: string;
  includeLongerTimeframes?: boolean;
  includeProjects?: boolean;
}

export async function getGoals(options: GetGoalsOptions = {}): Promise<Goal[]> {
  const data = await client.query({
    query: LIST_GOALS,
    variables: {
      spaceId: options.spaceId,
      includeTargets: !!options.includeTargets,
      includeSpace: !!options.includeSpace,
      timeframe: options.timeframe,
      includeLongerTimeframes: options.includeLongerTimeframes || false,
      includeProjects: options.includeProjects || false,
    },
    fetchPolicy: "network-only",
  });

  return data.data.goals;
}

const LIST_GOALS = gql`
  fragment Targets on Goal {
    targets {
      id
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
      isCompanySpace
    }
  }

  query ListGols(
    $spaceId: ID
    $timeframe: String
    $includeTargets: Boolean!
    $includeSpace: Boolean!
    $includeLongerTimeframes: Boolean!
    $includeProjects: Boolean!
  ) {
    goals(spaceId: $spaceId, timeframe: $timeframe, includeLongerTimeframes: $includeLongerTimeframes) {
      id
      name
      insertedAt
      updatedAt
      isArchived
      timeframe
      parentGoalId
      progressPercentage

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

      projects @include(if: $includeProjects) {
        id
        name
      }

      ...GoalSpace @include(if: $includeSpace)
      ...Targets @include(if: $includeTargets)
    }
  }
`;
