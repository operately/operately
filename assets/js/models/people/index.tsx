import * as api from "@/api";
import Api, { GetMeInput } from "@/api";

export type Person = api.Person;

export { useGetMe, getPerson, getPeople, updateMyProfile } from "@/api";

export const getMe = async (input: GetMeInput) => {
  const res = await Api.getMe(input);
  return res.me as Person;
};

export function usePeopleSearch() {
  //
  // There are multiple components that use this hook. Some of them
  // pass in a string, others pass in an object with a query property.
  // These components are not maintained in this repo, so we can't
  // change them easily to all use the same format.
  //
  // This is a bit of a hack to make it work with both.
  //
  return async (arg: string | { query: string; ignoredIds?: string[] }): Promise<Person[]> => {
    let query = "";
    let ignoredIds: string[] = [];

    if (typeof arg === "string") {
      query = arg;
      ignoredIds = [];
    } else {
      query = arg.query;
      ignoredIds = arg.ignoredIds || [];
    }

    const res = await Api.searchPeople({ query, ignoredIds });
    return res.people as Person[];
  };
}

export function firstName(person: Pick<Person, "fullName">): string {
  return person.fullName!.split(" ")[0]!;
}

export function shortName(person: Pick<Person, "fullName">): string {
  return firstName(person) + " " + lastNameInitial(person) + ".";
}

function lastNameInitial(person: Pick<Person, "fullName">): string {
  return person.fullName!.split(" ").slice(-1)[0]![0]!;
}

export type NameFormat = "first" | "short" | "full";

export function formattedName(person: Pick<Person, "fullName">, nameFormat: NameFormat): string {
  if (nameFormat === "first") {
    return firstName(person);
  }

  if (nameFormat === "short") {
    return shortName(person);
  }

  return person.fullName!;
}

export function logOut() {
  const csrfToken = document.querySelector<HTMLMetaElement>("meta[name=csrf-token]")?.content;

  const headers = {
    "x-csrf-token": csrfToken,
  } as HeadersInit;

  return fetch("/accounts/log_out", {
    method: "DELETE",
    headers: headers,
  });
}

export function logIn(email: string, password: string) {
  const csrfToken = document.querySelector<HTMLMetaElement>("meta[name=csrf-token]")?.content;

  const headers = { "x-csrf-token": csrfToken, "Content-Type": "application/json" } as HeadersInit;

  const data = {
    email,
    password,
  };

  return fetch("/accounts/log_in", {
    method: "POST",
    headers: headers,
    body: JSON.stringify(data),
  });
}

export function sortByName(people: Person[]): Person[] {
  return people
    .slice()
    .map((p) => p!)
    .sort((a, b) => a!.fullName!.localeCompare(b!.fullName!));
}
