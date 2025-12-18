import * as GoalAddPage from "@/pages/GoalAddPage";
import * as ProfileEditPage from "@/pages/ProfileEditPage";
import * as ProjectAddPage from "@/pages/ProjectAddPage";
import * as ProjectContributorsAddPage from "@/pages/ProjectContributorsAddPage";
import * as ProjectContributorsEditPage from "@/pages/ProjectContributorsEditPage";
import * as React from "react";

import { LinkOptions } from "@/features/ResourceHub";
import { useRouteLoaderData } from "react-router-dom";
import { WorkMap } from "turboui";

const UNACCEPTABLE_PATH_CHARACTERS = ["/", "?", "#", "[", "]"];

export class Paths {
  private companyId: string;

  constructor(opts: { companyId: string }) {
    this.companyId = opts.companyId;
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

  setupPath() {
    return this.createCompanyPath(["setup"]);
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

  companyAiAgentsPath() {
    return this.createCompanyPath(["admin", "manage-ai-agents"]);
  }

  companyManageAiAgentsPath() {
    return this.createCompanyPath(["admin", "manage-ai-agents"]);
  }

  companyAgentPath(agentId: string) {
    return this.createCompanyPath(["admin", "manage-ai-agents", agentId]);
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

  projectPath(projectId: string, tab?: "overview" | "tasks" | "check-ins" | "discussions" | "activity") {
    if (tab) {
      return this.createCompanyPath(["projects", projectId]) + `?tab=${tab}`;
    }

    return this.createCompanyPath(["projects", projectId]);
  }

  projectMarkdownExportPath(projectId: string) {
    return this.createCompanyPath(["exports", "markdown", "projects", projectId]);
  }

  projectCheckInNewPath(projectId: string) {
    return this.createCompanyPath(["projects", projectId, "check-ins", "new"]);
  }

  projectDiscussionNewPath(projectId: string) {
    return this.createCompanyPath(["projects", projectId, "discussions", "new"]);
  }

  projectDiscussionPath(discussionId: string) {
    return this.createCompanyPath(["project-discussions", discussionId]);
  }

  projectDiscussionEditPath(discussionId: string) {
    return this.createCompanyPath(["project-discussions", discussionId, "edit"]);
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
    return this.createCompanyPath(["projects", projectId]) + "?tab=check-ins";
  }

  projectRetrospectivePath(projectId: string) {
    return this.createCompanyPath(["projects", projectId, "retrospective"]);
  }

  projectRetrospectiveEditPath(projectId: string) {
    return this.createCompanyPath(["projects", projectId, "retrospective", "edit"]);
  }

  projectMilestonePath(milestoneId: string) {
    return this.createCompanyPath(["milestones", milestoneId]);
  }

  projectMilestoneKanbanPath(milestoneId: string) {
    return this.createCompanyPath(["milestones", milestoneId, "kanban"]);
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

  editProjectAccessLevelsPath(projectId: string) {
    return this.createCompanyPath(["projects", projectId, "edit", "permissions"]);
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

  goalPath(goalId: string, params?: { tab?: "overview" | "discussions" | "check-ins" | "activity" }) {
    return this.createCompanyPath(["goals", goalId]) + (params?.tab ? "?tab=" + params.tab : "");
  }

  goalMarkdownExportPath(goalId: string) {
    return this.createCompanyPath(["exports", "markdown", "goals", goalId]);
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

  profilePath(personId: string, tab?: string) {
    if (tab) {
      return this.createCompanyPath(["people", personId]) + "?tab=" + tab;
    } else {
      return this.createCompanyPath(["people", personId]);
    }
  }

  projectEditPermissionsPath(projectId: string) {
    return this.createCompanyPath(["projects", projectId, "edit", "permissions"]);
  }

  projectClosePath(projectId: string) {
    return this.createCompanyPath(["projects", projectId, "close"]);
  }

  taskPath(taskId: string) {
    return this.createCompanyPath(["tasks", taskId]);
  }

  inviteTeamPath() {
    return this.createCompanyPath(["invite-team"]);
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
    return this.companyId;
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

export function usePaths() {
  const data = useRouteLoaderData("companyRoot") as { company: { id: string | null } };

  if (!data) {
    throw new Error("usePaths must be used within a company route context");
  }

  if (!data.company) {
    throw new Error("usePaths must be used within a company route context with a valid company");
  }

  const paths = React.useMemo(() => {
    return new Paths({ companyId: data.company.id! });
  }, [data.company.id]);

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
