import * as GoalAddPage from "@/pages/GoalAddPage";
import * as ProfileEditPage from "@/pages/ProfileEditPage";
import * as ProjectAddPage from "@/pages/ProjectAddPage";
import * as ProjectContributorsAddPage from "@/pages/ProjectContributorsAddPage";
import * as ProjectContributorsEditPage from "@/pages/ProjectContributorsEditPage";
import * as React from "react";

import { LinkOptions } from "@/features/ResourceHub";
import { WorkMap } from "turboui";
import { useLoadedData } from "../pages/GoalAddPage/loader";

const UNACCEPTABLE_PATH_CHARACTERS = ["/", "?", "#", "[", "]"];

export class Paths {
  //
  // When deprecatedLookup is true, the paths will use the old lookup method
  // which is based on the company ID in the window.location.pathname.
  //
  // We've deprecated this method and replaced it with a new one that uses
  // a more robust way to get the company ID, based on the react-router context.
  //
  private deprecatedLookup: boolean;
  private companyId?: string | null;

  constructor(opts: { deprecatedLookup?: boolean; companyId: string | null }) {
    this.companyId = opts.companyId || null;
    this.deprecatedLookup = opts.deprecatedLookup || false;
  }

  static lobbyPath() {
    return "/";
  }

  static forgotPasswordPath() {
    return "/forgot-password";
  }

  static newCompanyPath() {
    return "/new";
  }

  static companyHomePath(companyId: string) {
    return "/" + companyId;
  }

  companyPermissionsPath() {
    return this.createCompanyPath(["admin", "permissions"]);
  }

  companyRenamePath() {
    return this.createCompanyPath(["admin", "rename"]);
  }

  companyAdminRestoreSuspendedPeoplePath() {
    return this.createCompanyPath(["admin", "restore-suspended-people"]);
  }

  feedPath() {
    return this.createCompanyPath(["feed"]);
  }

  homePath() {
    return this.createCompanyPath([]);
  }

  accountPath() {
    return this.createCompanyPath(["account"]);
  }

  accountAppearancePath() {
    return this.createCompanyPath(["account", "appearance"]);
  }

  accountSecurityPath() {
    return this.createCompanyPath(["account", "security"]);
  }

  accountChangePasswordPath() {
    return this.createCompanyPath(["account", "security", "change-password"]);
  }

  notificationsPath() {
    return this.createCompanyPath(["notifications"]);
  }

  reviewPath() {
    return this.createCompanyPath(["review"]);
  }

  profileEditPath(personId: string, params?: { from: ProfileEditPage.FromLocation }) {
    const path = this.createCompanyPath(["people", personId, "profile", "edit"]);

    if (params?.from) {
      return path + "?from=" + params.from;
    } else {
      return path;
    }
  }

  companyAdminPath() {
    return this.createCompanyPath(["admin"]);
  }

  companyManagePeoplePath() {
    return this.createCompanyPath(["admin", "manage-people"]);
  }

  companyManageAdminsPath() {
    return this.createCompanyPath(["admin", "manage-admins"]);
  }

  companyManagePeopleAddPeoplePath() {
    return this.createCompanyPath(["admin", "manage-people", "add"]);
  }

  companyAdminManageTrustedDomainsPath() {
    return this.createCompanyPath(["admin", "manage-trusted-email-domains"]);
  }

  peoplePath() {
    return this.createCompanyPath(["people"]);
  }

  discussionsPath(spaceId: string) {
    return this.createCompanyPath(["spaces", spaceId, "discussions"]);
  }

  discussionDraftsPath(spaceId: string) {
    return this.createCompanyPath(["spaces", spaceId, "discussions", "drafts"]);
  }

  discussionPath(discussionId: string) {
    return this.createCompanyPath(["discussions", discussionId]);
  }

  discussionEditPath(discussionId: string) {
    return this.createCompanyPath(["discussions", discussionId, "edit"]);
  }

  discussionNewPath(spaceId: string) {
    return this.createCompanyPath(["spaces", spaceId, "discussions", "new"]);
  }

  projectPath(projectId: string) {
    return this.createCompanyPath(["projects", projectId]);
  }

  projectCheckInNewPath(projectId: string) {
    return this.createCompanyPath(["projects", projectId, "check-ins", "new"]);
  }

  projectNewPath({ goalId }: { goalId: string }) {
    return this.createCompanyPath(["projects", "new"]) + "?goalId=" + goalId;
  }

  projectCheckInPath(checkInId: string) {
    return this.createCompanyPath(["project-check-ins", checkInId]);
  }

  projectCheckInEditPath(checkInId: string) {
    return this.createCompanyPath(["project-check-ins", checkInId, "edit"]);
  }

  projectCheckInsPath(projectId: string) {
    return this.createCompanyPath(["projects", projectId, "check-ins"]);
  }

  projectRetrospectivePath(projectId: string) {
    return this.createCompanyPath(["projects", projectId, "retrospective"]);
  }

  projectRetrospectiveEditPath(projectId: string) {
    return this.createCompanyPath(["projects", projectId, "retrospective", "edit"]);
  }

  projectMilestonesPath(projectId: string) {
    return this.createCompanyPath(["projects", projectId, "milestones"]);
  }

  projectMilestonePath(milestoneId: string) {
    return this.createCompanyPath(["milestones", milestoneId]);
  }

  projectContributorsPath(projectId: string) {
    return this.createCompanyPath(["projects", projectId, "contributors"]);
  }

  projectContributorsAddPath(projectId: string, params: ProjectContributorsAddPage.UrlParams) {
    return this.createCompanyPath(["projects", projectId, "contributors", "add"]) + encodeUrlParams(params);
  }

  projectContributorsEditPath(contributorId: string, params?: ProjectContributorsEditPage.UrlParams) {
    return this.createCompanyPath(["project-contribs", contributorId, "edit"]) + encodeUrlParams(params);
  }

  editProjectGoalPath(projectId: string) {
    return this.createCompanyPath(["projects", projectId, "edit", "goal"]);
  }

  editProjectNamePath(projectId: string) {
    return this.createCompanyPath(["projects", projectId, "edit", "name"]);
  }

  editProjectAccessLevelsPath(projectId: string) {
    return this.createCompanyPath(["projects", projectId, "edit", "permissions"]);
  }

  moveProjectPath(projectId: string) {
    return this.createCompanyPath(["projects", projectId, "move"]);
  }

  pauseProjectPath(projectId: string) {
    return this.createCompanyPath(["projects", projectId, "pause"]);
  }

  resumeProjectPath(projectId: string) {
    return this.createCompanyPath(["projects", projectId, "resume"]);
  }

  orgChartPath() {
    return this.createCompanyPath(["people", "org-chart"]);
  }

  newSpacePath() {
    return this.createCompanyPath(["spaces", "new"]);
  }

  resourceHubPath(resourceHubId: string) {
    return this.createCompanyPath(["resource-hubs", resourceHubId]);
  }

  resourceHubDraftsPath(resourceHubId: string) {
    return this.createCompanyPath(["resource-hubs", resourceHubId, "drafts"]);
  }

  resourceHubFolderPath(folderId: string) {
    return this.createCompanyPath(["folders", folderId]);
  }

  resourceHubFilePath(fileId: string) {
    return this.createCompanyPath(["files", fileId]);
  }

  resourceHubEditFilePath(fileId: string) {
    return this.createCompanyPath(["files", fileId, "edit"]);
  }

  resourceHubDocumentPath(documentId: string) {
    return this.createCompanyPath(["documents", documentId]);
  }

  resourceHubEditDocumentPath(documentId: string) {
    return this.createCompanyPath(["documents", documentId, "edit"]);
  }

  resourceHubNewDocumentPath(resourceHubId: string, folderId?: string) {
    if (folderId) {
      return this.createCompanyPath(["resource-hubs", resourceHubId, "new-document"]) + "?folderId=" + folderId;
    } else {
      return this.createCompanyPath(["resource-hubs", resourceHubId, "new-document"]);
    }
  }

  resourceHubNewLinkPath(resourceHubId: string, attrs: { folderId?: string; type?: LinkOptions }) {
    const { folderId, type } = attrs;

    if (folderId && type) {
      return (
        this.createCompanyPath(["resource-hubs", resourceHubId, "new-link"]) + `?folderId=${folderId}&type=${type}`
      );
    } else if (folderId) {
      return this.createCompanyPath(["resource-hubs", resourceHubId, "new-link"]) + "?folderId=" + folderId;
    } else if (type) {
      return this.createCompanyPath(["resource-hubs", resourceHubId, "new-link"]) + "?type=" + type;
    } else {
      return this.createCompanyPath(["resource-hubs", resourceHubId, "new-link"]);
    }
  }

  resourceHubEditLinkPath(linkId: string) {
    return this.createCompanyPath(["links", linkId, "edit"]);
  }

  resourceHubLinkPath(linkId: string) {
    return this.createCompanyPath(["links", linkId]);
  }

  spacePath(spaceId: string) {
    return this.createCompanyPath(["spaces", spaceId]);
  }

  spaceEditPath(spaceId: string) {
    return this.createCompanyPath(["spaces", spaceId, "edit"]);
  }

  spaceEditGeneralAccessPath(spaceId: string) {
    return this.createCompanyPath(["spaces", spaceId, "edit", "general-access"]);
  }

  spaceDiscussionsPath(spaceId: string) {
    return this.createCompanyPath(["spaces", spaceId, "discussions"]);
  }

  spaceAppearancePath(spaceId: string) {
    return this.createCompanyPath(["spaces", spaceId, "appearance"]);
  }

  spaceAccessManagementPath(spaceId: string) {
    return this.createCompanyPath(["spaces", spaceId, "access"]);
  }

  spaceAddMembersPath(spaceId: string) {
    return this.createCompanyPath(["spaces", spaceId, "add-members"]);
  }

  workMapPath(tab?: WorkMap.Filter) {
    return this.createCompanyPath(["work-map"]) + (tab ? `?tab=${tab}` : "");
  }

  spaceWorkMapPath(spaceId: string, tab?: WorkMap.Filter) {
    return this.createCompanyPath(["spaces", spaceId, "work-map"]) + (tab ? `?tab=${tab}` : "");
  }

  goalClosePath(goalId: string) {
    return this.createCompanyPath(["goals", goalId, "complete"]);
  }

  goalPath(goalId: string) {
    return this.createCompanyPath(["goals", goalId]);
  }

  // Temporary path
  goalV2Path(goalId: string) {
    return this.createCompanyPath(["goals", goalId, "v2"]);
  }
  goalV3Path(goalId: string) {
    return this.createCompanyPath(["goals", goalId, "v3"]);
  }

  newGoalPath(params?: GoalAddPage.UrlParams) {
    return this.createCompanyPath(["goals", "new"]) + encodeUrlParams(params);
  }

  spaceNewGoalPath(spaceId: string) {
    return this.createCompanyPath(["spaces", spaceId, "goals", "new"]);
  }

  newProjectPath(params?: ProjectAddPage.UrlParams) {
    return this.createCompanyPath(["projects", "new"]) + encodeUrlParams(params);
  }

  projectsPath() {
    return this.createCompanyPath(["projects"]);
  }

  goalAboutPath(goalId: string) {
    return this.createCompanyPath(["goals", goalId, "about"]);
  }

  goalSubgoalsPath(goalId: string) {
    return this.createCompanyPath(["goals", goalId, "subgoals"]);
  }

  goalNewPath({ parentGoalId }: { parentGoalId: string }) {
    return this.createCompanyPath(["goals", "new"]) + "?parentGoalId=" + parentGoalId;
  }

  goalCheckInNewPath(goalId: string) {
    return this.createCompanyPath(["goals", goalId, "check-ins", "new"]);
  }

  goalCheckInPath(checkInId: string) {
    return this.createCompanyPath(["goal-check-ins", checkInId]);
  }

  newGoalDiscussionPath(goalId: string) {
    return this.createCompanyPath(["goals", goalId, "discussions", "new"]);
  }

  goalDiscussionsPath(goalId: string) {
    return this.createCompanyPath(["goals", goalId, "discussions"]);
  }

  goalDiscussionPath(id: string) {
    return this.createCompanyPath(["goal-activities", id]);
  }

  goalRetrospectivePath(id: string) {
    return this.createCompanyPath(["goal-activities", id]);
  }

  goalDiscussionEditPath(activityId: string) {
    return this.createCompanyPath(["goal-activities", activityId, "edit"]);
  }

  goalActivityPath(activityId: string) {
    return this.createCompanyPath(["goal-activities", activityId]);
  }

  goalReopenPath(goalId: string) {
    return this.createCompanyPath(["goals", goalId, "reopen"]);
  }

  goalArchivePath(goalId: string) {
    return this.createCompanyPath(["goals", goalId, "archive"]);
  }

  goalEditParentPath(goalId: string) {
    return this.createCompanyPath(["goals", goalId, "edit", "parent"]);
  }

  goalEditTimeframePath(goalId: string) {
    return this.createCompanyPath(["goals", goalId, "edit", "timeframe"]);
  }

  goalEditPath(goalId: string) {
    return this.createCompanyPath(["goals", goalId, "edit"]);
  }

  profileV2Path(personId: string) {
    return this.createCompanyPath(["people", personId, "v2"]);
  }

  profilePath(personId: string) {
    return this.createCompanyPath(["people", personId]);
  }

  projectEditTimelinePath(projectId: string) {
    return this.createCompanyPath(["projects", projectId, "edit", "timeline"]);
  }

  projectEditDescriptionPath(projectId: string) {
    return this.createCompanyPath(["projects", projectId, "edit", "description"]);
  }

  projectEditResourcesPath(projectId: string) {
    return this.createCompanyPath(["projects", projectId, "edit", "resources"]);
  }

  projectEditResourcePath(resourceId: string) {
    return this.createCompanyPath(["project-resources", resourceId, "edit"]);
  }

  projectEditPermissionsPath(projectId: string) {
    return this.createCompanyPath(["projects", projectId, "edit", "permissions"]);
  }

  projectNewResourcePath(projectId: string, { resourceType }: { resourceType: string }) {
    return this.createCompanyPath(["projects", projectId, "resources", "new"]) + "?resourceType=" + resourceType;
  }

  projectClosePath(projectId: string) {
    return this.createCompanyPath(["projects", projectId, "close"]);
  }

  taskPath(taskId: string) {
    return this.createCompanyPath(["tasks", taskId]);
  }

  //
  // Private utility methods
  //

  private createCompanyPath(elements: string[]) {
    return this.createPath([this.getCompanyID(), ...elements]);
  }

  private createPath(elements: string[]) {
    Paths.validatePathElements(elements);
    return "/" + elements.join("/");
  }

  private getCompanyID(): string {
    if (this.deprecatedLookup) {
      const parts = window.location.pathname.split("/") as string[];

      if (parts.length >= 2) {
        return parts[1]!;
      } else {
        throw new Error("Company ID not found in path");
      }
    } else {
      if (!this.companyId) {
        throw new Error("Can't create company paths without a company ID");
      }

      return this.companyId;
    }
  }

  static validatePathElements(elements: string[]) {
    elements.forEach((element) => {
      if (!element) {
        throw new Error("Unsuported path elements: " + JSON.stringify(elements));
      }

      UNACCEPTABLE_PATH_CHARACTERS.forEach((char) => {
        if (element.includes(char)) {
          throw new Error(`Path elements cannot contain ${char}`);
        }
      });
    });
  }
}

export const DeprecatedPaths = new Paths({ deprecatedLookup: true, companyId: null });

export function usePaths() {
  const { company } = useLoadedData();

  const paths = React.useMemo(() => {
    return new Paths({ deprecatedLookup: false, companyId: company?.id || null });
  }, [company.id]);

  return paths;
}

type ID = string | null | undefined;

export function compareIds(a: ID, b: ID) {
  if (!a || !b) return false;

  if (isUUID(a) && isUUID(b)) {
    return a === b;
  }

  return idWithoutComments(a) === idWithoutComments(b);
}

export function includesId(idsList: ID[], id: ID) {
  if (!id) return false;

  const ids = idsList
    .filter((id) => id)
    .map((id: string) => {
      if (isUUID(id)) return id;
      return idWithoutComments(id);
    });

  if (isUUID(id)) return ids.includes(id);
  return ids.includes(idWithoutComments(id));
}

function isUUID(id: string) {
  return id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
}

function idWithoutComments(id: string) {
  const parts = id.split("-");
  return parts[parts.length - 1];
}

export function encodeUrlParams(params?: Record<any, any>) {
  if (!params) return "";

  const queryStr = Object.entries(params)
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join("&");

  return queryStr ? "?" + queryStr : "";
}
