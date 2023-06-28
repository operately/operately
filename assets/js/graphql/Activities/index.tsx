import { gql, useQuery } from "@apollo/client";
import { Person } from "@/graphql/People";

export type Activity = {
  id: string;
  insertedAt: string;
  actionType: string;
  resourceType: string;
  resource: any;
  person: Person;
  eventData: ProjectCreateEventData;
};

type ProjectCreateEventData = {
  champion: Person;
};

const LIST_ACTIVITIES = gql`
  query ListActivities($scope_type: String!, $scope_id: ID!) {
    activities(scope_type: $scope_type, scope_id: $scope_id) {
      id
      insertedAt

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
          content
        }
      }

      eventData {
        ... on ProjectCreateEventData {
          champion {
            id
            fullName
            avatarUrl
          }
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
  });
}
