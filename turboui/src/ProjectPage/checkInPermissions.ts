import type { ProjectPage } from ".";

export function viewerCanPostCheckIn(props: Pick<ProjectPage.State, "champion" | "currentUser" | "permissions" | "state">) {
  return props.permissions.canEdit && props.state !== "closed";
}
