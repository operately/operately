import { gql, useQuery } from "@apollo/client";
import { Person } from "@/graphql/People";

export type Activity = {
  id: string;
  insertedAt: string;
  scopeType: string;
  scopeId: string;
  actionType: string;
  resourceType: string;
  resource: any;
  person: Person;
  eventData: ProjectCreateEventData | MilestoneCreateEventData | CommentPostEventData;
};

export type ProjectCreateEventData = {
  champion: Person;
};

export type MilestoneCreateEventData = {
  title: string;
};

export type CommentPostEventData = {
  updateId: string;
};

const LIST_ACTIVITIES = gql`
  query ListActivities($scope_type: String!, $scope_id: ID!) {
    activities(scope_type: $scope_type, scope_id: $scope_id) {
      id
      insertedAt

      scopeType
      scopeId

      actionType
      resourceType

      person {
        id
        fullName
        avatarUrl
      }

      resource {
        __typename

        ... on Project {
          id
          name
        }

        ... on Update {
          id
          message
        }

        ... on Milestone {
          id
          title
        }

        ... on Comment {
          id
          message
        }
      }

      eventData {
        ... on ActivityEventDataProjectCreate {
          champion {
            id
            fullName
            avatarUrl
          }
        }

        ... on ActivityEventDataMilestoneCreate {
          title
        }

        ... on ActivityEventDataCommentPost {
          updateId
        }
      }
    }
  }
`;

export function useListActivities(scope_type: string, scope_id: string) {
  return useQuery(LIST_ACTIVITIES, {
    variables: {
      scope_type,
      scope_id,
    },
    fetchPolicy: "network-only",
  });
}
