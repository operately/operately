import { gql } from "@apollo/client";
export { ProjectPermissions } from "@/gql";

export const FRAGMENT = gql`
  {
    canView

    canCreateMilestone
    canDeleteMilestone

    canEditMilestone
    canEditDescription
    canEditContributors
    canEditTimeline
    canEditResources

    canCheckIn
    canAcknowledgeCheckIn
  }
`;
