import { useQuery, gql } from "@apollo/client";

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
  query Assignments {
    assignments {
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
  return useQuery(GET_ASSIGNMENTS);
}
