import * as api from "@/api";
import * as Time from "@/utils/time";

import Api from "@/api";
import { Paths } from "../../routes/paths";
export type Person = api.Person;

export { getPeople, getPerson, updateProfile, useGetMe, useGetPeople } from "@/api";
export { usePersonFieldSearch } from "./usePersonFieldSearch";
export { useMentionedPersonSearch } from "./useMentionedPersonSearch";

export type SearchScope =
  | { type: "company"; id?: undefined }
  | { type: "project"; id: string }
  | { type: "space"; id: string }
  | { type: "goal"; id: string }
  | { type: "resource_hub"; id: string }
  | { type: "none"; id?: undefined };

export const CompanyWideSearchScope = { type: "company" } as SearchScope;
export const NoneSearchScope = { type: "none" } as SearchScope;

export function usePeopleSearch(scope: SearchScope) {
  //
  // There are multiple components that use this hook. Some of them
  // pass in a string, others pass in an object with a query property.
  // These components are not maintained in this repo, so we can't
  // change them easily to all use the same format.
  //
  // This is a bit of a hack to make it work with both.
  //
  return async (arg: string | { query: string; ignoredIds?: string[] }): Promise<Person[]> => {
    if (scope.type === "none") return [];

    let query = "";
    let ignoredIds: string[] = [];

    if (typeof arg === "string") {
      query = arg;
      ignoredIds = [];
    } else {
      query = arg.query;
      ignoredIds = arg.ignoredIds || [];
    }

    const res = await Api.searchPeople({
      query,
      ignoredIds,
      searchScopeType: scope.type,
      searchScopeId: scope.id,
    });
    return res.people as Person[];
  };
}

export function parsePersonForTurboUi(paths: Paths, person: Person | null | undefined) {
  if (!person) {
    return null;
  } else {
    return {
      id: person.id!,
      fullName: person.fullName!,
      title: person.title || "",
      avatarUrl: person.avatarUrl || "",
      profileLink: paths.profilePath(person.id!),
    };
  }
}

export function usePossibleManagersSearch(personId: string) {
  return async (): Promise<Person[]> => {
    const res = await Api.listPossibleManagers({
      userId: personId,
    });
    return res.people as Person[];
  };
}

export function firstName(person: Pick<Person, "fullName">): string {
  return person.fullName!.split(" ")[0]!;
}

export function shortName(person: Pick<Person, "fullName">): string {
  const length = person.fullName!.split(" ").length;

  if (length < 2) return firstName(person);
  return firstName(person) + " " + lastNameInitial(person) + ".";
}

function lastNameInitial(person: Pick<Person, "fullName">): string {
  return person.fullName!.split(" ").slice(-1)[0]![0]!;
}

type NameFormat = "first" | "short" | "full";

export function formattedName(person: Pick<Person, "fullName">, nameFormat: NameFormat): string {
  if (nameFormat === "first") {
    return firstName(person);
  }

  if (nameFormat === "short") {
    return shortName(person);
  }

  return person.fullName!;
}

export function namesListToString(members: Person[]) {
  const names = members.map((person) => shortName(person));

  if (names.length === 2) {
    return `${names[0]} and ${names[1]}`;
  } else if (names.length > 2) {
    const last = names.pop();
    return `${names.join(", ")} and ${last}`;
  } else {
    return names[0]!;
  }
}

export function sortByName(people: Person[]): Person[] {
  return people
    .slice()
    .map((p) => p!)
    .sort((a, b) => a!.fullName!.localeCompare(b!.fullName!));
}

export function hasValidInvite(person: Person): boolean {
  if (!person.hasOpenInvitation) return false;
  if (!person.invitation?.expiresAt) return false;

  const time = Time.parse(person.invitation!.expiresAt!);
  if (!time) return false;

  return time > Time.now();
}

export function hasInvitationExpired(person: Person): boolean {
  if (!person.hasOpenInvitation) return false;
  if (!person.invitation?.expiresAt) return false;

  const time = Time.parse(person.invitation!.expiresAt!);
  if (!time) return false;

  return time < Time.now();
}

export interface PersonWithLink extends Person {
  link: string;
}

/**
 * Converts a Person or array of Person objects to include profile links
 */
export function toPersonWithLink(paths: Paths, person: Person): PersonWithLink;
export function toPersonWithLink(paths: Paths, people: Person[]): PersonWithLink[];
export function toPersonWithLink(paths: Paths, personOrPeople: Person | Person[]) {
  if (Array.isArray(personOrPeople)) {
    return personOrPeople.map((person) => toPersonWithLink(paths, person));
  }

  const person = personOrPeople;

  return {
    ...person,
    link: paths.profilePath(person.id!),
  };
}
