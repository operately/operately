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

  static projectCheckInEditPath(projectId: string, checkInId: string) {
    return createPath(["projects", projectId, "check-ins", checkInId, "edit"]);
  }

  static projectCheckInsPath(projectId: string) {
    return createPath(["projects", projectId, "check-ins"]);
  }

  static spacePath(spaceId: string) {
    return createPath(["spaces", spaceId]);
  }

  static goalPath(goalId: string) {
    return createPath(["goals", goalId]);
  }

  static goalCheckInPath(goalId: string, checkInId: string) {
    return createPath(["goals", goalId, "check-ins", checkInId]);
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
      throw new Error("Path elements cannot be null or undefined");
    }

    UNACCEPTABLE_CHARACTERS.forEach((char) => {
      if (element.includes(char)) {
        throw new Error(`Path elements cannot contain ${char}`);
      }
    });
  });
}
