import * as api from "@/api";
import { match } from "ts-pattern";

export type ProjectContributor = api.ProjectContributor;
export type ContributorRole = "champion" | "reviewer" | "contributor";

export const CHAMPION_RESPONSIBILITY = "Champion - Responsible for the success of the project";
export const REVIEWER_RESPONSIBILITY = "Reviewer - Responsible for reviewing and acknowledging progress";

export function responsibility(contributor: ProjectContributor | undefined, role: ContributorRole) {
  return match(role)
    .with("champion", () => CHAMPION_RESPONSIBILITY)
    .with("reviewer", () => REVIEWER_RESPONSIBILITY)
    .otherwise(() => contributor?.responsibility || "");
}

export function isPermissionsEditable(role: ContributorRole) {
  return match(role)
    .with("champion", () => false)
    .with("reviewer", () => false)
    .otherwise(() => true);
}

export function isResponsibilityEditable(role: ContributorRole) {
  return role !== "champion" && role !== "reviewer";
}

export function isResponsibilityRemovable(role: ContributorRole) {
  return role !== "champion" && role !== "reviewer";
}

export function splitByRole(contributors: ProjectContributor[]) {
  const champion = contributors.find((c) => c.role === "champion")!;
  const reviewer = contributors.find((c) => c.role === "reviewer")!;
  const rest = contributors.filter((c) => c.role === "contributor");

  return { champion, reviewer, contributors: rest };
}
