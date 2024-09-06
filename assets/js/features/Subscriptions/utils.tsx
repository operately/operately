import { Person } from "@/models/people";
import { Project } from "@/models/projects";
import { NotifiablePerson } from "@/features/Subscriptions";
import { compareIds } from "@/routes/paths";

export function findNotifiableProjectContributors(project: Project, me?: Person): NotifiablePerson[] {
  const people = project
    .contributors!.filter((contrib) => !compareIds(contrib.person!.id, me?.id))
    .map((contrib) => {
      const person = {
        id: contrib.person!.id!,
        fullName: contrib.person!.fullName!,
        avatarUrl: contrib.person!.avatarUrl!,
        title: "",
      };

      switch (contrib.role) {
        case "reviewer":
          person.title = "Reviewer";
          break;
        case "champion":
          person.title = "Champion";
          break;
        default:
          person.title = contrib.responsibility!;
      }

      return person;
    });

  return people;
}
