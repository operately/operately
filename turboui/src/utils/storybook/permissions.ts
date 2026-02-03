import { ProjectPermissions } from "../../ProjectPage/types";
import { GoalPermissions } from "../../GoalPage/types";

/**
 * Generates a ProjectPermissions object with all permissions set to the same value,
 * with the ability to override specific permissions.
 *
 * @param baseValue - The default value for all permissions (true or false)
 * @param overrides - Optional object to override specific permissions
 * @returns A complete ProjectPermissions object
 */
export function generatePermissions(
  baseValue: boolean = true,
  overrides?: Partial<ProjectPermissions>,
): ProjectPermissions {
  const permissions: ProjectPermissions = {
    canView: baseValue,
    canCommentOnMilestone: baseValue,
    canCommentOnCheckIn: baseValue,
    canCommentOnRetrospective: baseValue,
    canCommentOnTask: baseValue,
    canCreateMilestone: baseValue,
    canCreateTask: baseValue,
    canCreateDiscussion: baseValue,
    canCompleteMilestone: baseValue,
    canReopenMilestone: baseValue,
    canDeleteMilestone: baseValue,
    canEditContributors: baseValue,
    canEditMilestone: baseValue,
    canEditDescription: baseValue,
    canEditTimeline: baseValue,
    canEditResources: baseValue,
    canEditGoal: baseValue,
    canEditName: baseValue,
    canEditSpace: baseValue,
    canEditRetrospective: baseValue,
    canEditPermissions: baseValue,
    canEditSubscriptionsList: baseValue,
    canClose: baseValue,
    canPause: baseValue,
    canResume: baseValue,
    canCheckIn: baseValue,
    canEditTask: baseValue,
    canEditStatuses: baseValue,
    canAcknowledgeCheckIn: baseValue,
    canComment: baseValue,
    canDelete: baseValue,
  };

  if (overrides) {
    return { ...permissions, ...overrides };
  }

  return permissions;
}

/**
 * Generates a GoalPermissions object with all permissions set to the same value,
 * with the ability to override specific permissions.
 *
 * @param baseValue - The default value for all permissions (true or false)
 * @param overrides - Optional object to override specific permissions
 * @returns A complete GoalPermissions object
 */
export function generateGoalPermissions(
  baseValue: boolean = true,
  overrides?: Partial<GoalPermissions>,
): GoalPermissions {
  const permissions: GoalPermissions = {
    canView: baseValue,
    canEdit: baseValue,
    canCheckIn: baseValue,
    canClose: baseValue,
    canArchive: baseValue,
    canReopen: baseValue,
    canDelete: baseValue,
    canOpenDiscussion: baseValue,
    canEditDiscussion: baseValue,
    canEditAccessLevel: baseValue,
    canEditTarget: baseValue,
  };

  if (overrides) {
    return { ...permissions, ...overrides };
  }

  return permissions;
}
