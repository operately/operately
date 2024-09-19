import { Person } from "@/models/people";
import { Project } from "@/models/projects";
import { Space } from "@/models/spaces";
import { Goal } from "@/models/goals";
import { Subscription } from "@/models/notifications";
import { NotifiablePerson } from "@/features/Subscriptions";
import { compareIds, includesId } from "@/routes/paths";

export function getSelectedPeopleFromSubscriptions(people: NotifiablePerson[], subscriptions: Subscription[]) {
  const ids = subscriptions.map((s) => s.person!.id!);

  return people.filter((p) => includesId(ids, p.id));
}

export function getReviewerAndChampion(people: NotifiablePerson[]) {
  return people.filter((p) => p.role === "Reviewer" || p.role === "Champion");
}

export function findNotifiableProjectContributors(project: Project, me?: Person): NotifiablePerson[] {
  const people = project
    .contributors!.filter((contrib) => !compareIds(contrib.person!.id, me?.id))
    .map((contrib) => {
      const person = {
        id: contrib.person!.id!,
        fullName: contrib.person!.fullName!,
        avatarUrl: contrib.person!.avatarUrl!,
        role: "",
      };

      switch (contrib.role) {
        case "reviewer":
          person.role = "Reviewer";
          break;
        case "champion":
          person.role = "Champion";
          break;
        default:
          person.role = contrib.responsibility!;
      }

      return person;
    });

  return people;
}

export function findGoalNotifiablePeople(goal: Goal, me?: Person): NotifiablePerson[] {
  const members = goal.space!.members!;

  // Ensure reviewer and champion are in the list
  if (!members.some((member) => compareIds(member.id, goal.champion?.id))) {
    members.push(goal.champion!);
  }
  if (!members.some((member) => compareIds(member.id, goal.reviewer?.id))) {
    members.push(goal.reviewer!);
  }

  // Parse Person into NotifiablePerson
  const people = members
    .filter((member) => !compareIds(me?.id, member.id))
    .map((member) => {
      const person = {
        id: member.id!,
        fullName: member.fullName!,
        avatarUrl: member.avatarUrl!,
        role: member.title!,
      };

      if (compareIds(member.id, goal.reviewer?.id)) {
        person.role = "Reviewer";
      }
      if (compareIds(member.id, goal.champion?.id)) {
        person.role = "Champion";
      }

      return person;
    });

  return people;
}

export function findSpaceNotifiablePeople(space: Space, me?: Person): NotifiablePerson[] {
  return space
    .members!.filter((member) => !compareIds(me?.id, member.id))
    .map((member) => {
      return {
        id: member.id!,
        fullName: member.fullName!,
        avatarUrl: member.avatarUrl!,
        role: member.title!,
      };
    });
}
