import { Person } from "@/gql";

export { Person } from "@/gql";

export function firstName(person: Person): string {
  return person.fullName.split(" ")[0]!;
}

export function shortName(person: Person): string {
  return firstName(person) + " " + lastNameInitial(person) + ".";
}

export function lastNameInitial(person: Person): string {
  return person.fullName.split(" ").slice(-1)[0]![0]!;
}
