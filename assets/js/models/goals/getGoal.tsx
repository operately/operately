import { gql } from "@apollo/client";
import client from "@/graphql/client";

interface GetGoalOptions {
  includeTargets?: boolean;
  includeProjects?: boolean;
  includeLastCheckIn?: boolean;
}

export async function getGoal(id: string, options: GetGoalOptions = {}) {
  let data = await client.query({
    query: QUERY,
    variables: {
      id: id,
      includeTargets: options.includeTargets || false,
      includeProjects: options.includeProjects || false,
      includeLastCheckIn: options.includeLastCheckIn || false,
    },
    fetchPolicy: "network-only",
  });

  return data.data.goal;
}

const QUERY = gql`
  query GetGoal($id: ID!, $includeTargets: Boolean!, $includeProjects: Boolean!, $includeLastCheckIn: Boolean!) {
    goal(id: $id) {
      id
      name
      timeframe
      isArchived
      archivedAt
      description
      nextUpdateScheduledAt

      space {
        id
        name
        icon
        color
      }

      permissions {
        canCheckIn
        canAcknowledgeCheckIn
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

      targets @include(if: $includeTargets) {
        id
        name
        from
        to
        unit
        value
      }

      projects @include(if: $includeProjects) {
        id
        name
        status
        closedAt
        archivedAt

        lastCheckIn {
          id
          status
        }

        contributors {
          id
          responsibility
          role
          person {
            id
            fullName
            avatarUrl
            title
          }
        }

        nextMilestone {
          id
          title
          deadlineAt
          status
        }

        milestones {
          id
          title
          deadlineAt
          status
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
          message
        }
      }
    }
  }
`;
