import type { ProjectPage } from ".";

type Person = ProjectPage.Person | null | undefined;

export function viewerCanPostCheckIn(props: Pick<ProjectPage.State, "champion" | "currentUser" | "permissions" | "state">) {
  return props.permissions.canEdit && props.state !== "closed" && isProjectChampion(props.currentUser, props.champion);
}

export function isProjectChampion(currentUser: Person, champion: Person) {
  return !!currentUser?.id && !!champion?.id && currentUser.id === champion.id;
}
