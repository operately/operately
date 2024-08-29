import { Person } from "@/models/people";
import { Project } from "@/models/projects";

export function findNotifiableProjectContributors(project: Project, me: Person): Person[] {
  const people = project
    .contributors!.filter((contrib) => contrib.person!.id !== me.id)
    .map((contrib) => {
      switch (contrib.role) {
        case "reviewer":
          return { ...contrib.person, title: "Reviewer" };
        case "champion":
          return { ...contrib.person, title: "Champion" };
        default:
          return { ...contrib.person, title: contrib.responsibility };
      }
    });

  return people;
}
