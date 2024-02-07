import { gql } from "@apollo/client";
import client from "@/graphql/client";
import * as UpdateContent from "@/graphql/Projects/update_content";

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
  fragment PersonFields on Person {
    id
    fullName
    avatarUrl
    title
  }

  fragment Targets on Goal {
    targets {
      id
      name
      from
      to
      unit
      value
    }
  }

  fragment Projects on Goal {
    projects {
      id
      name
      health
      status
      closedAt
      archivedAt

      contributors {
        id
        responsibility
        role
        person {
          ...PersonFields
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
  }

  fragment LastCheckIn on Goal {
    lastCheckIn {
      id
      insertedAt
      author {
        ...PersonFields
      }

      content ${UpdateContent.FRAGMENT}
    }
  }

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
        ...PersonFields
      }

      reviewer {
        ...PersonFields
      }

      ...Targets @include(if: $includeTargets)
      ...Projects @include(if: $includeProjects)
      ...LastCheckIn @include(if: $includeLastCheckIn)
    }
  }
`;
