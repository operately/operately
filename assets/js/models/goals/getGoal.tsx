import { gql } from "@apollo/client";
import client from "@/graphql/client";

interface GetGoalOptions {
  includeTargets?: boolean;
  includeProjects?: boolean;
}

export async function getGoal(id: string, options: GetGoalOptions = {}) {
  let data = await client.query({
    query: QUERY,
    variables: {
      id: id,
      includeTargets: options.includeTargets || false,
      includeProjects: options.includeProjects || false,
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
    }
  }

  fragment Projects on Goal {
    projects {
      id
      name
      health

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

  query GetGoal($id: ID!, $includeTargets: Boolean!, $includeProjects: Boolean!) {
    goal(id: $id) {
      id
      name
      timeframe
      isArchived
      archivedAt

      space {
        id
        name
        icon
        color
      }

      permissions {
        canCheckIn
      }

      champion {
        ...PersonFields
      }

      reviewer {
        ...PersonFields
      }

      ...Targets @include(if: $includeTargets)
      ...Projects @include(if: $includeProjects)
    }
  }
`;
