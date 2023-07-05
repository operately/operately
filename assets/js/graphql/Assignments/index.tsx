import { useQuery, gql } from "@apollo/client";
import * as Time from "@/utils/time";

export interface Assignments {
  projectStatusUpdates: {
    id: string;
    name: string;
    nextUpdateScheduledAt: string;
  }[];

  milestones: {
    id: string;
    title: string;
    deadlineAt: string;
    project: {
      id: string;
      name: string;
    };
  }[];
}

const GET_ASSIGNMENTS = gql`
  query Assignments($rangeStart: DateTime!, $rangeEnd: DateTime!) {
    assignments(rangeStart: $rangeStart, rangeEnd: $rangeEnd) {
      projectStatusUpdates {
        id
        name
        nextUpdateScheduledAt
      }

      milestones {
        id
        title
        deadlineAt

        project {
          id
          name
        }
      }
    }
  }
`;

export function useAssignments() {
  return useQuery(GET_ASSIGNMENTS, {
    variables: {
      rangeStart: Time.epochZero().toISOString(),
      rangeEnd: Time.endOfNextWeek().toISOString(),
    },
  });
}
