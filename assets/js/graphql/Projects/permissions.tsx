import { gql } from "@apollo/client";

export interface Permissions {
  canView: boolean;
  canEditContributors: boolean;
}

export const FRAGMENT = gql`
  {
    canView
    canEditContributors
  }
`;
