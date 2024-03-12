import type { Person } from "@/gql";
export type { Person } from "@/gql/generated";

export { getPeople } from "./getPeople";
export { getPerson } from "./getPerson";
export { getMe } from "./getMe";
export { usePeopleSearch } from "@/graphql/People";

export function firstName(person: Pick<Person, "fullName">): string {
  return person.fullName.split(" ")[0]!;
}

export function shortName(person: Pick<Person, "fullName">): string {
  return firstName(person) + " " + lastNameInitial(person) + ".";
}

function lastNameInitial(person: Pick<Person, "fullName">): string {
  return person.fullName.split(" ").slice(-1)[0]![0]!;
}

export type NameFormat = "first" | "short" | "full";

export function formattedName(person: Pick<Person, "fullName">, nameFormat: NameFormat): string {
  if (nameFormat === "first") {
    return firstName(person);
  }

  if (nameFormat === "short") {
    return shortName(person);
  }

  return person.fullName;
}
