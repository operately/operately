export class Paths {
  static projectPath(projectId: string) {
    return `/projects/${projectId}`;
  }

  static projectCheckInPath(projectId: string, checkInId: string) {
    return `/projects/${projectId}/check-ins/${checkInId}`;
  }

  static projectCheckInNewPath(projectId: string) {
    return `/projects/${projectId}/check-ins/new`;
  }

  static projectCheckInEditPath(projectId: string, checkInId: string) {
    return `/projects/${projectId}/check-ins/${checkInId}/edit`;
  }

  static projectCheckInsPath(projectId: string) {
    return `/projects/${projectId}/check-ins`;
  }

  static spacePath(spaceId: string) {
    return `/spaces/${spaceId}`;
  }
}
