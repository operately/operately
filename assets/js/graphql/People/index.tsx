import { gql, useApolloClient } from "@apollo/client";

export const FRAGMENT = `
  {
    id
    fullName
    title
    avatarUrl
  }
`;

export { Person } from "@/gql";
import { Person } from "@/gql";

const SEARCH_PEOPLE = gql`
  query SearchPeople($query: String!, $ignoredIds: [ID!]) {
    searchPeople(query: $query, ignoredIds: $ignoredIds) {
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
      query: SEARCH_PEOPLE,
      variables: { query, ignoredIds },
    });

    if (!res.data) return [];
    if (!res.data.searchPeople) return [];

    return res.data.searchPeople as Person[];
  };
}

export function firstName(person: Person) {
  return person.fullName.split(" ")[0];
}
