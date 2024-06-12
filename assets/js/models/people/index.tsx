import { makeQueryFn } from "@/graphql/client";
import Api, { GetMeInput } from "@/api";

import { Person, GetPeopleDocument, GetPersonDocument, GetPersonQueryVariables } from "@/gql/generated";

export { Person } from "@/gql/generated";

export const getPeople = makeQueryFn(GetPeopleDocument, "people") as () => Promise<Person[]>;
export const getPerson = makeQueryFn(GetPersonDocument, "person") as (v: GetPersonQueryVariables) => Promise<Person>;

export const getMe = async (input: GetMeInput) => {
  const res = await Api.getMe(input);
  return res.me as Person;
};

export const useMe = Api.useGetMe;

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
