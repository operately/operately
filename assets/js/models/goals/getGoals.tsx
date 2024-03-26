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
  includeLastCheckIn?: boolean;
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
      includeLastCheckIn: options.includeLastCheckIn || false,
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
    $includeLastCheckIn: Boolean!
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

      space {
        id
        name
      }

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
        status

        startedAt
        deadline

        space {
          id
          name
        }

        champion {
          id
          fullName
          avatarUrl
          title
        }

        lastCheckIn {
          id
          insertedAt

          author {
            id
            fullName
            avatarUrl
            title
          }

          status
          description
        }

        milestones {
          id
          title
          status
          deadlineAt
          completedAt
        }
      }

      lastCheckIn @include(if: $includeLastCheckIn) {
        id
        insertedAt
        author {
          id
          fullName
          avatarUrl
          title
        }

        content {
          __typename
          ... on UpdateContentGoalCheckIn {
            message
          }
        }
      }

      ...GoalSpace @include(if: $includeSpace)
      ...Targets @include(if: $includeTargets)
    }
  }
`;
