import client from "@/graphql/client";
import { useApolloClient } from "@apollo/client";

import {
  Person,
  GetPeopleDocument,
  GetPersonDocument,
  GetPersonQueryVariables,
  GetMeDocument,
  GetMeQueryVariables,
  SearchPeopleDocument,
  useGetMeQuery,
} from "@/gql/generated";

export async function getPeople(): Promise<Person[]> {
  let res = await client.query({
    query: GetPeopleDocument,
    variables: {},
    fetchPolicy: "network-only",
  });

  return res.data.people;
}

export async function getPerson(variables: GetPersonQueryVariables): Promise<Person> {
  let res = await client.query({
    query: GetPersonDocument,
    variables: variables,
    fetchPolicy: "network-only",
  });

  return res.data.person;
}

export async function getMe(variables: GetMeQueryVariables): Promise<Person> {
  let meData = await client.query({
    query: GetMeDocument,
    fetchPolicy: "network-only",
    variables: variables,
  });

  return meData.data.me;
}

export function useMe(variables: GetMeQueryVariables): any {
  return useGetMeQuery({
    variables: variables,
    fetchPolicy: "network-only",
  });
}

export function usePeopleSearch() {
  const client = useApolloClient();

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

    const res = await client.query({
      query: SearchPeopleDocument,
      variables: { query, ignoredIds },
    });

    if (!res.data) return [];
    if (!res.data.searchPeople) return [];

    return res.data.searchPeople as Person[];
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
