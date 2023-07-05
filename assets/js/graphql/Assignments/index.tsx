import { useQuery, gql } from "@apollo/client";

const GET_ASSIGNMENTS = gql`
  query Assignments {
    assignments {
      projectStatusUpdates {
        id
        name
      }

      milestones {
        id
        name
        deadlineAt
      }
    }
  }
`;

export function useAssignments() {
  return useQuery(GET_ASSIGNMENTS);
}
