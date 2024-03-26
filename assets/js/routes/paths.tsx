export class Paths {
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

  static profilePath(personId: string) {
    return createPath(["people", personId]);
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
