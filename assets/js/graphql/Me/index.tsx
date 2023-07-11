import { useQuery, useMutation, gql } from "@apollo/client";

import { Project } from "@/graphql/Projects";

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

export interface Dashboard {
  id: string;
  panels: Panel[];
}

export interface Panel {
  id: string;
  type: string;
  index: number;

  linkedResource?: Project;
}

export function useHomeDashboard(options = {}) {
  return useQuery(
    gql`
      query GetHomeDashboard {
        homeDashboard {
          id
          panels {
            id
            index
            type

            linkedResource {
              ... on Project {
                name
                phase

                contributors {
                  role
                  person {
                    id
                    fullName
                    avatarUrl
                  }
                }

                milestones {
                  title
                  status
                }
              }
            }
          }
        }
      }
    `,
    options,
  );
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

export function useProfileMutation(options = {}) {
  return useMutation(
    gql`
      mutation UpdateProfile($input: UpdateProfileInput!) {
        updateProfile(input: $input) {
          fullName
          title
        }
      }
    `,
    {
      refetchQueries: [{ query: GET_ME }],
      ...options,
    },
  );
}

export function useUpdateDashboard(options = {}) {
  return useMutation(
    gql`
      mutation UpdateDashboard($input: UpdateDashboardInput!) {
        updateDashboard(input: $input) {
          id
        }
      }
    `,
    options,
  );
}
