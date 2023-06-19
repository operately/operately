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

export const CHAMPION_RESPONSIBILITY =
  "Champion - Responsible for the success of the project";

export const REVIEWER_RESPONSIBILITY =
  "Reviewer - Responsible for reviewing and acknowledging progress";

export function responsibility(
  contributor: Contributor | undefined,
  role: ContributorRole
) {
  switch (role) {
    case "champion":
      return CHAMPION_RESPONSIBILITY;
    case "reviewer":
      return REVIEWER_RESPONSIBILITY;
    default:
      return contributor?.responsibility || "";
  }
}

export function isResponsibilityEditable(role: ContributorRole) {
  return role !== "champion" && role !== "reviewer";
}

export function isResponsibilityRemovable(role: ContributorRole) {
  return role !== "champion" && role !== "reviewer";
}

export function splitByRole(contributors: Contributor[]) {
  const champion = contributors.find((c) => c.role === "champion");
  const reviewer = contributors.find((c) => c.role === "reviewer");
  const rest = contributors.filter((c) => c.role === "contributor");

  return { champion, reviewer, contributors: rest };
}
