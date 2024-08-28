import { Person } from "@/models/people";
import { Project } from "@/models/projects";

export function findNotifiableProjectContributors(project: Project): Person[] {
  const people = project
    .contributors!.filter((contrib) => contrib.role !== "champion")
    .map((contrib) => {
      switch (contrib.role) {
        case "reviewer":
          return { ...contrib.person, title: "Reviewer" };
        default:
          return { ...contrib.person, title: contrib.responsibility };
      }
    });

  return people;
}
