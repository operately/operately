export interface ProjectPermissions {
  canView: boolean;
  canCommentOnMilestone: boolean;
  canCommentOnCheckIn: boolean;
  canCommentOnRetrospective: boolean;
  canCommentOnTask: boolean;
  canCreateMilestone: boolean;
  canCreateTask: boolean;
  canCreateDiscussion: boolean;
  canCompleteMilestone: boolean;
  canReopenMilestone: boolean;
  canDeleteMilestone: boolean;
  canEdit: boolean;
  canEditSpace: boolean;
  canEditPermissions: boolean;
  canClose: boolean;
  canPause: boolean;
  canResume: boolean;
  canCheckIn: boolean;
  canAcknowledgeCheckIn: boolean;
  canComment: boolean;
  canDelete: boolean;
  hasFullAccess: boolean;
}
