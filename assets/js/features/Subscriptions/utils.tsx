import { Person } from "@/models/people";
import { Project } from "@/models/projects";
import { NotifiablePerson } from "@/features/Subscriptions";
import { compareIds } from "@/routes/paths";

interface FindAllPeopleLabelOpts {
  projectName?: string;
}

export function findAllPeopleLabel(people: NotifiablePerson[], opts: FindAllPeopleLabelOpts) {
  const part1 = people.length > 1 ? `All ${people.length} people` : "The 1 person";
  let part2 = "";

  if (opts.projectName) {
    part2 = ` contributing to ${opts.projectName}`;
  }

  return part1 + part2;
}

export function findSelectedPeopleLabel(selectedPeople: NotifiablePerson[]) {
  switch (selectedPeople.length) {
    case 0:
      return "Only the people I select";
    case 1:
      return "Only the following person I selected";
    default:
      return `Only the following ${selectedPeople.length} people I selected`;
  }
}

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
