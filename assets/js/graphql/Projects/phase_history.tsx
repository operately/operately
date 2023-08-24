import { gql } from "@apollo/client";

export interface PhaseHistory {
  phase: string;
  startTime: string;
  endTime?: string;
}

export const GQL_FRAGMENT = gql`
  {
    phase
    startTime
    endTime
  }
`;
