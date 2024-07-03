export class Paths {
  static lobbyPath() {
    return "/";
  }

  static newCompanyPath() {
    return createPath(["new"]);
  }

  static companyHomePath(companyId: string) {
    return createPath([companyId]);
  }

  static feedPath() {
    return createCompanyPath(["feed"]);
  }

  static isHomePath() {
    return window.location.pathname === Paths.homePath();
  }

  static homePath() {
    return createCompanyPath([]);
  }

  static accountPath() {
    return createCompanyPath(["account"]);
  }

  static notificationsPath() {
    return createCompanyPath(["notifications"]);
  }

  static accountProfilePath() {
    return createCompanyPath(["account", "profile"]);
  }

  static accountAppearancePath() {
    return createCompanyPath(["account", "appearance"]);
  }

  static companyAdminPath() {
    return createCompanyPath(["admin"]);
  }

  static companyManagePeoplePath() {
    return createCompanyPath(["admin", "manage-people"]);
  }

  static companyManageAdminsPath() {
    return createCompanyPath(["admin", "manage-admins"]);
  }

  static companyManagePeopleAddPeoplePath() {
    return createCompanyPath(["admin", "manage-people", "add"]);
  }

  static companyAdminManageTrustedDomainsPath() {
    return createCompanyPath(["admin", "manage-trusted-email-domains"]);
  }

  static peoplePath() {
    return createCompanyPath(["people"]);
  }

  static discussionPath(discussionId: string) {
    return createCompanyPath(["discussions", discussionId]);
  }

  static discussionEditPath(discussionId: string) {
    return createCompanyPath(["discussions", discussionId, "edit"]);
  }

  static discussionNewPath(spaceId: string) {
    return createCompanyPath(["spaces", spaceId, "discussions", "new"]);
  }

  static projectPath(projectId: string) {
    return createCompanyPath(["projects", projectId]);
  }

  static projectCheckInPath(projectId: string, checkInId: string) {
    return createCompanyPath(["projects", projectId, "check-ins", checkInId]);
  }

  static projectCheckInNewPath(projectId: string) {
    return createCompanyPath(["projects", projectId, "check-ins", "new"]);
  }

  static projectNewPath({ goalId }: { goalId: string }) {
    return createCompanyPath(["projects", "new"]) + "?goalId=" + goalId;
  }

  static projectCheckInEditPath(projectId: string, checkInId: string) {
    return createCompanyPath(["projects", projectId, "check-ins", checkInId, "edit"]);
  }

  static projectCheckInsPath(projectId: string) {
    return createCompanyPath(["projects", projectId, "check-ins"]);
  }

  static projectRetrospectivePath(projectId: string) {
    return createCompanyPath(["projects", projectId, "retrospective"]);
  }

  static projectMilestonesPath(projectId: string) {
    return createCompanyPath(["projects", projectId, "milestones"]);
  }

  static projectMilestonePath(projectId: string, milestoneId: string) {
    return createCompanyPath(["projects", projectId, "milestones", milestoneId]);
  }

  static projectContributorsPath(projectId: string) {
    return createCompanyPath(["projects", projectId, "contributors"]);
  }

  static editProjectGoalPath(projectId: string) {
    return createCompanyPath(["projects", projectId, "edit", "goal"]);
  }

  static editProjectNamePath(projectId: string) {
    return createCompanyPath(["projects", projectId, "edit", "name"]);
  }

  static moveProjectPath(projectId: string) {
    return createCompanyPath(["projects", projectId, "move"]);
  }

  static pauseProjectPath(projectId: string) {
    return createCompanyPath(["projects", projectId, "pause"]);
  }

  static resumeProjectPath(projectId: string) {
    return createCompanyPath(["projects", projectId, "resume"]);
  }

  static orgChartPath() {
    return createCompanyPath(["people", "org-chart"]);
  }

  static newSpacePath() {
    return createCompanyPath(["spaces", "new"]);
  }

  static spacePath(spaceId: string) {
    return createCompanyPath(["spaces", spaceId]);
  }

  static spaceEditPath(spaceId: string) {
    return createCompanyPath(["spaces", spaceId, "edit"]);
  }

  static spaceGoalsPath(spaceId: string) {
    return createCompanyPath(["spaces", spaceId, "goals"]);
  }

  static spaceProjectsPath(spaceId: string) {
    return createCompanyPath(["spaces", spaceId, "projects"]);
  }

  static spaceMembersPath(spaceId: string) {
    return createCompanyPath(["spaces", spaceId, "members"]);
  }

  static spaceDiscussionsPath(spaceId: string) {
    return createCompanyPath(["spaces", spaceId, "discussions"]);
  }

  static spaceAppearancePath(spaceId: string) {
    return createCompanyPath(["spaces", spaceId, "appearance"]);
  }

  static goalClosePath(goalId: string) {
    return createCompanyPath(["goals", goalId, "complete"]);
  }

  static goalPath(goalId: string) {
    return createCompanyPath(["goals", goalId]);
  }

  static goalCheckInNewPath(goalId: string) {
    return createCompanyPath(["goals", goalId, "progress-updates", "new"]);
  }

  static goalCheckInPath(goalId: string, checkInId: string) {
    return createCompanyPath(["goals", goalId, "progress-updates", checkInId]);
  }

  static goalCheckInsPath(goalId: string) {
    return createCompanyPath(["goals", goalId, "progress-updates"]);
  }

  static newGoalPath(params?: { companyWide: boolean }) {
    return createCompanyPath(["goals", "new"]) + (params?.companyWide ? "?company-wide=true" : "");
  }

  static spaceNewGoalPath(spaceId: string) {
    return createCompanyPath(["spaces", spaceId, "goals", "new"]);
  }

  static spaceNewProjectPath(spaceId: string) {
    return createCompanyPath(["spaces", spaceId, "projects", "new"]);
  }

  static newProjectPath() {
    return createCompanyPath(["projects", "new"]);
  }

  static projectsPath() {
    return createCompanyPath(["projects"]);
  }

  static goalsPath() {
    return createCompanyPath(["goals"]);
  }

  static goalAboutPath(goalId: string) {
    return createCompanyPath(["goals", goalId, "about"]);
  }

  static goalSubgoalsPath(goalId: string) {
    return createCompanyPath(["goals", goalId, "subgoals"]);
  }

  static goalNewPath({ parentGoalId }: { parentGoalId: string }) {
    return createCompanyPath(["goals", "new"]) + "?parentGoalId=" + parentGoalId;
  }

  static goalProgressUpdatePath(goalId: string, checkInId: string) {
    return createCompanyPath(["goals", goalId, "progress-updates", checkInId]);
  }

  static goalProgressUpdateNewPath(goalId: string) {
    return createCompanyPath(["goals", goalId, "progress-updates", "new"]);
  }

  static goalEditProgressUpdatePath(goalId: string, checkInId: string) {
    return createCompanyPath(["goals", goalId, "progress-updates", checkInId, "edit"]);
  }

  static newGoalDiscussionPath(goalId: string) {
    return createCompanyPath(["goals", goalId, "discussions", "new"]);
  }

  static goalDiscussionsPath(goalId: string) {
    return createCompanyPath(["goals", goalId, "discussions"]);
  }

  static goalDiscussionEditPath(goalId: string, activityId: string) {
    return createCompanyPath(["goals", goalId, "discussions", activityId, "edit"]);
  }

  static goalActivityPath(goalId: string, activityId: string) {
    return createCompanyPath(["goals", goalId, "activities", activityId]);
  }

  static createCompanyPath(goalId: string) {
    return createCompanyPath(["goals", goalId, "complete"]);
  }

  static goalReopenPath(goalId: string) {
    return createCompanyPath(["goals", goalId, "reopen"]);
  }

  static goalArchivePath(goalId: string) {
    return createCompanyPath(["goals", goalId, "archive"]);
  }

  static goalEditParentPath(goalId: string) {
    return createCompanyPath(["goals", goalId, "edit", "parent"]);
  }

  static goalEditTimeframePath(goalId: string) {
    return createCompanyPath(["goals", goalId, "edit", "timeframe"]);
  }

  static goalEditPath(goalId: string) {
    return createCompanyPath(["goals", goalId, "edit"]);
  }

  static profilePath(personId: string) {
    return createCompanyPath(["people", personId]);
  }

  static profileGoalsPath(personId: string) {
    return createCompanyPath(["people", personId, "goals"]);
  }

  static projectEditTimelinePath(projectId: string) {
    return createCompanyPath(["projects", projectId, "edit", "timeline"]);
  }

  static projectEditDescriptionPath(projectId: string) {
    return createCompanyPath(["projects", projectId, "edit", "description"]);
  }

  static projectEditResourcesPath(projectId: string) {
    return createCompanyPath(["projects", projectId, "edit", "resources"]);
  }

  static projectEditResourcePath(projectId: string, resourceId: string) {
    return createCompanyPath(["projects", projectId, "resources", resourceId, "edit"]);
  }

  static projectNewResourcePath(projectId: string, { resourceType }: { resourceType: string }) {
    return createCompanyPath(["projects", projectId, "resources", "new"]) + "?resourceType=" + resourceType;
  }

  static projectClosePath(projectId: string) {
    return createCompanyPath(["projects", projectId, "close"]);
  }

  static taskPath(taskId: string) {
    return createCompanyPath(["tasks", taskId]);
  }
}

function createCompanyPath(elements: string[]) {
  const companyID = window.location.pathname.split("/")[1];

  if (!companyID) {
    throw new Error("Company ID not found in path");
  }

  return createPath([companyID, ...elements]);
}

function createPath(elements: string[]) {
  validatePathElements(elements);

  return "/" + elements.join("/");
}

const UNACCEPTABLE_CHARACTERS = ["/", "?", "#", "[", "]"];

function validatePathElements(elements: string[]) {
  elements.forEach((element) => {
    if (!element) {
      throw new Error("Unsuported path elements: " + JSON.stringify(elements));
    }

    UNACCEPTABLE_CHARACTERS.forEach((char) => {
      if (element.includes(char)) {
        throw new Error(`Path elements cannot contain ${char}`);
      }
    });
  });
}

export function compareIds(a: string, b: string) {
  return idWithoutComments(a) === idWithoutComments(b);
}

function idWithoutComments(id: string) {
  const parts = id.split("-");
  return parts[parts.length - 1];
}
