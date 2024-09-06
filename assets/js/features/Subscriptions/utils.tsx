import { Person } from "@/models/people";
import { Project } from "@/models/projects";
import { Subscription } from "@/models/notifications";
import { NotifiablePerson } from "@/features/Subscriptions";
import { compareIds, includesId } from "@/routes/paths";

export function getSelectedPeopleFromSubscriptions(people: NotifiablePerson[], subscriptions: Subscription[]) {
  const ids = subscriptions.map((s) => s.person!.id!);

  return people.filter((p) => includesId(ids, p.id));
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
