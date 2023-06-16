export type ContributorRole = "champion" | "reviewer" | "contributor";

export interface Contributor {
  id: string;
  role: ContributorRole;
  responsibility: string;
  person: {
    id: string;
    fullName: string;
    title: string;
    avatarUrl: string;
  };
}

const CHAMPION_RESPONSIBILITY =
  "Champion - Responsible for the success of the project";

const REVIEWER_RESPONSIBILITY =
  "Reviewer - Responsible for reviewing and acknowledging progress";

export function responsibility(contributor: Contributor) {
  switch (contributor.role) {
    case "champion":
      return CHAMPION_RESPONSIBILITY;
    case "reviewer":
      return REVIEWER_RESPONSIBILITY;
    default:
      return contributor.responsibility;
  }
}

export function isResponsibilityEditable(contributor: Contributor) {
  return contributor.role !== "champion" && contributor.role !== "reviewer";
}

export function isResponsibilityRemovable(contributor: Contributor) {
  return contributor.role !== "champion" && contributor.role !== "reviewer";
}
