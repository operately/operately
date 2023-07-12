import { useQuery, useMutation, gql } from "@apollo/client";

import { Project } from "@/graphql/Projects";
import { Person } from "@/graphql/People";

const GET_ME = gql`
  query GetMe {
    me {
      id
      fullName
      avatarUrl
      title

      sendDailySummary
      notifyOnMention
      notifyAboutAssignments
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
                id
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

export function useUpdateNotificationsSettings(options = {}) {
  return useMutation(
    gql`
      mutation UpdateNotificationsSettings($input: UpdateNotificationSettingsInput!) {
        updateNotificationSettings(input: $input) {
          sendDailySummary
          notifyOnMention
          notifyAboutAssignments
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

export function sortPanelsByIndex(panels: Panel[]) {
  let copy = ([] as Panel[]).concat(panels);

  return copy.sort((a, b) => {
    if (a.index === null) return 1;
    if (b.index === null) return -1;

    return a.index - b.index;
  });
}

export function areNotificationsEnabled(me: Person) {
  return me.sendDailySummary || me.notifyOnMention || me.notifyAboutAssignments;
}
