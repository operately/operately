import { useQuery, gql } from "@apollo/client";
import * as Time from "@/utils/time";

import { Project } from "@/graphql/Projects";
import { Milestone } from "@/graphql/Projects/milestones";

export interface Assignments {
  type: "milestone" | "project_status_update";
  due: string;
  resource: Project | Milestone;
}

const GET_ASSIGNMENTS = gql`
  query Assignments($rangeStart: DateTime!, $rangeEnd: DateTime!) {
    assignments(rangeStart: $rangeStart, rangeEnd: $rangeEnd) {
      assignments {
        type
        due

        resource {
          ... on Project {
            id
            name
          }

          ... on Milestone {
            id
            title
            project {
              id
              name
            }
          }
        }
      }
    }
  }
`;

export function useAssignments() {
  return useQuery(GET_ASSIGNMENTS, {
    fetchPolicy: "network-only",
    variables: {
      rangeStart: Time.epochZero().toISOString(),
      rangeEnd: Time.endOfNextWeek().toISOString(),
    },
  });
}
