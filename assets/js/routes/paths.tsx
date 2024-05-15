export class Paths {
  static peoplePath() {
    return createPath(["people"]);
  }

  static discussionPath(spaceId: string, discussionId: string) {
    return createPath(["spaces", spaceId, "discussions", discussionId]);
  }

  static projectPath(projectId: string) {
    return createPath(["projects", projectId]);
  }

  static projectCheckInPath(projectId: string, checkInId: string) {
    return createPath(["projects", projectId, "check-ins", checkInId]);
  }

  static projectCheckInNewPath(projectId: string) {
    return createPath(["projects", projectId, "check-ins", "new"]);
  }

  static projectNewPath({ goalId }: { goalId: string }) {
    return createPath(["projects", "new"]) + "?goalId=" + goalId;
  }

  static projectCheckInEditPath(projectId: string, checkInId: string) {
    return createPath(["projects", projectId, "check-ins", checkInId, "edit"]);
  }

  static projectCheckInsPath(projectId: string) {
    return createPath(["projects", projectId, "check-ins"]);
  }

  static projectRetrospectivePath(projectId: string) {
    return createPath(["projects", projectId, "retrospective"]);
  }

  static projectMilestonePath(projectId: string, milestoneId: string) {
    return createPath(["projects", projectId, "milestones", milestoneId]);
  }

  static editProjectGoalPath(projectId: string) {
    return createPath(["projects", projectId, "edit", "goal"]);
  }

  static editProjectNamePath(projectId: string) {
    return createPath(["projects", projectId, "edit", "name"]);
  }

  static moveProjectPath(projectId: string) {
    return createPath(["projects", projectId, "move"]);
  }

  static pauseProjectPath(projectId: string) {
    return createPath(["projects", projectId, "pause"]);
  }

  static resumeProjectPath(projectId: string) {
    return createPath(["projects", projectId, "resume"]);
  }

  static spacePath(spaceId: string) {
    return createPath(["spaces", spaceId]);
  }

  static spaceGoalsPath(spaceId: string) {
    return createPath(["spaces", spaceId, "goals"]);
  }

  static spaceProjectsPath(spaceId: string) {
    return createPath(["spaces", spaceId, "projects"]);
  }

  static goalPath(goalId: string) {
    return createPath(["goals", goalId]);
  }

  static goalsPath() {
    return createPath(["goals"]);
  }

  static goalAboutPath(goalId: string) {
    return createPath(["goals", goalId, "about"]);
  }

  static goalSubgoalsPath(goalId: string) {
    return createPath(["goals", goalId, "subgoals"]);
  }

  static goalNewPath({ parentGoalId }: { parentGoalId: string }) {
    return createPath(["goals", "new"]) + "?parentGoalId=" + parentGoalId;
  }

  static goalProgressUpdatePath(goalId: string, checkInId: string) {
    return createPath(["goals", goalId, "progress-updates", checkInId]);
  }

  static goalProgressUpdateNewPath(goalId: string) {
    return createPath(["goals", goalId, "progress-updates", "new"]);
  }

  static goalDiscussionsPath(goalId: string) {
    return createPath(["goals", goalId, "discussions"]);
  }

  static goalActivityPath(goalId: string, activityId: string) {
    return createPath(["goals", goalId, "activities", activityId]);
  }

  static newGoalDiscussionPath(goalId: string) {
    return createPath(["goals", goalId, "discussions", "new"]);
  }

  static closeGoalPath(goalId: string) {
    return createPath(["goals", goalId, "complete"]);
  }

  static reopenGoalPath(goalId: string) {
    return createPath(["goals", goalId, "reopen"]);
  }

  static archiveGoalPath(goalId: string) {
    return createPath(["goals", goalId, "archive"]);
  }

  static editGoalParentPath(goalId: string) {
    return createPath(["goals", goalId, "edit", "parent"]);
  }

  static editGoalTimeframePath(goalId: string) {
    return createPath(["goals", goalId, "edit", "timeframe"]);
  }

  static editGoalPath(goalId: string) {
    return createPath(["goals", goalId, "edit"]);
  }

  static profilePath(personId: string) {
    return createPath(["people", personId]);
  }

  static profileGoalsPath(personId: string) {
    return createPath(["people", personId, "goals"]);
  }
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
