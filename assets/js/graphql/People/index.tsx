import React from "react";
import { gql, ApolloClient, useQuery, useApolloClient } from "@apollo/client";

export interface Person {
  id: string;
  fullName: string;
  title: string;
  avatarUrl: string;
}

export function createProfile(client: ApolloClient<any>, fullName: string, title: string) {
  return client.mutate({
    mutation: gql`
      mutation CreateProfile($fullName: String!, $title: String!) {
        createProfile(fullName: $fullName, title: $title) {
          id
        }
      }
    `,
    variables: {
      fullName,
      title,
    },
  });
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

  return async (query: string) => {
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

const debounce = (callback: any, wait: number) => {
  let timeoutId: number | null = null;

  return (...args: any[]) => {
    if (timeoutId) window.clearTimeout(timeoutId);

    timeoutId = window.setTimeout(() => {
      callback.apply(null, args);
    }, wait);
  };
};

export function useDebouncedPeopleSearch(query: string) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const { data, loading, error } = usePeopleSearch(searchQuery);

  const debouncedSetSearchQuery = React.useMemo(() => {
    return debounce((q: any) => {
      setSearchQuery(q);
    }, 500);
  }, []);

  return {
    data,
    loading,
    error,
    setSearchQuery: debouncedSetSearchQuery,
  };
}

const GET_PERSON = gql`
  query GetPerson($id: ID!) {
    person(id: $id) {
      id
      fullName
      title
      avatarUrl
    }
  }
`;

export function usePerson(id: string) {
  return useQuery(GET_PERSON, {
    variables: { id },
  });
}
