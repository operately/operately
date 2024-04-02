export class Paths {
  static peoplePath() {
    return createPath(["people"]);
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

  static goalPath(goalId: string) {
    return createPath(["goals", goalId]);
  }

  static goalNewPath({ parentGoalId }: { parentGoalId: string }) {
    return createPath(["goals", "new"]) + "?parentGoalId=" + parentGoalId;
  }

  static goalCheckInPath(goalId: string, checkInId: string) {
    return createPath(["goals", goalId, "check-ins", checkInId]);
  }

  static closeGoalPath(goalId: string) {
    return createPath(["goals", goalId, "complete"]);
  }

  static archiveGoalPath(goalId: string) {
    return createPath(["goals", goalId, "archive"]);
  }

  static editGoalParentPath(goalId: string) {
    return createPath(["goals", goalId, "edit", "parent"]);
  }

  static editGoalPath(goalId: string) {
    return createPath(["goals", goalId, "edit"]);
  }

  static profilePath(personId: string) {
    return createPath(["people", personId]);
  }

  static profileActivityPath(personId: string) {
    return createPath(["people", personId, "activity"]);
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
