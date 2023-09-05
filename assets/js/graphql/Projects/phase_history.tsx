import { gql } from "@apollo/client";

export interface PhaseHistory {
  phase: string;
  startTime?: string;
  endTime?: string;
}

export const FRAGMENT = gql`
  {
    phase
    endTime
  }
`;
