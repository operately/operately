export class Paths {
  static projectCheckInPath(projectId: string, checkInId: string) {
    return `/projects/${projectId}/check-ins/${checkInId}`;
  }

  static projectCheckInNewPath(projectId: string) {
    return `/projects/${projectId}/check-ins/new`;
  }

  static projectCheckInsPath(projectId: string) {
    return `/projects/${projectId}/check-ins`;
  }
}
