import { useQuery, gql } from "@apollo/client";

const GET_ME = gql`
  query GetMe {
    me {
      id
      fullName
      avatarUrl
      title
    }
  }
`;

export function useMe() {
  return useQuery(GET_ME);
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
