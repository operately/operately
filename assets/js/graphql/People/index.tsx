import { gql, useApolloClient } from "@apollo/client";

export const FRAGMENT = `
  {
    id
    fullName
    title
    avatarUrl
  }
`;

export interface Person {
  id: string;
  fullName: string;
  title: string;
  avatarUrl: string;

  sendDailySummary: boolean;
  notifyOnMention: boolean;
  notifyAboutAssignments: boolean;
}

const SEARCH_PEOPLE = gql`
  query SearchPeople($query: String!) {
    searchPeople(query: $query) {
      id
      fullName
      title
      avatarUrl
    }
  }
`;

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
  return async (arg: string | { query: string }): Promise<Person[]> => {
    let query = "";

    if (typeof arg === "string") {
      query = arg;
    } else {
      query = arg.query;
    }

    const res = await client.query({
      query: SEARCH_PEOPLE,
      variables: {
        query: query,
      },
    });

    if (!res.data) return [];
    if (!res.data.searchPeople) return [];

    return res.data.searchPeople as Person[];
  };
}

export function firstName(person: Person) {
  return person.fullName.split(" ")[0];
}
