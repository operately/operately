import { gql } from "@apollo/client";

export const GQL_FRAGMENT = gql`
  {
    phase
    startTime
    endTime
    dueTime
  }
`;
