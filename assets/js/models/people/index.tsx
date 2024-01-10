import type { Person } from "@/gql";
export type { Person } from "@/gql/generated";

export { getPeople } from "./getPeople";
export { getPerson } from "./getPerson";
export { getMe } from "./getMe";

export function firstName(person: Person): string {
  return person.fullName.split(" ")[0]!;
}

export function shortName(person: Person): string {
  return firstName(person) + " " + lastNameInitial(person) + ".";
}

function lastNameInitial(person: Person): string {
  return person.fullName.split(" ").slice(-1)[0]![0]!;
}
