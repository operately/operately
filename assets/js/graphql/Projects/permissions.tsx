import { gql } from "@apollo/client";

export interface Permissions {
  canView: boolean;
  canEditContributors: boolean;

  canCreateMilestone: boolean;
  canDeleteMilestone: boolean;
  canEditMilestone: boolean;

  canCheckIn: boolean;
}

export const FRAGMENT = gql`
  {
    canView
    canEditContributors

    canCreateMilestone
    canDeleteMilestone
    canEditMilestone

    canCheckIn
  }
`;
