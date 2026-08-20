import type { Person, Subscriber } from "../../ApiTypes";
import { genPeople, type Person as StoryPerson } from "./genPeople";

export function asApiPerson(person: StoryPerson): Person {
  return {
    __typename: "person",
    id: person.id,
    fullName: person.fullName,
    title: person.title,
    avatarUrl: person.avatarUrl,
    email: `${person.id}@example.com`,
    type: "member",
  };
}

export function asSubscriber(
  person: StoryPerson,
  overrides: Partial<Omit<Subscriber, "person" | "__typename">> & { person?: Person | null } = {},
): Subscriber {
  const { person: personOverride, ...rest } = overrides;

  return {
    __typename: "subscriber",
    person: personOverride === undefined ? asApiPerson(person) : personOverride,
    isSubscribed: false,
    priority: false,
    role: null,
    ...rest,
  };
}

export function genSubscribers(count: number, overrides?: Partial<Omit<Subscriber, "person" | "__typename">>): Subscriber[] {
  return genPeople(count).map((person) => asSubscriber(person, overrides));
}
