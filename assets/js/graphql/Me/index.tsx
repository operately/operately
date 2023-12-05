import { useQuery, useMutation, gql } from "@apollo/client";

import { Project } from "@/graphql/Projects";

export const GET_ME = gql`
  query GetMe {
    me {
      id
      fullName
      avatarUrl
      title

      sendDailySummary
      notifyOnMention
      notifyAboutAssignments

      theme
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

export function useUpdateAppearanceMutation(options = {}) {
  return useMutation(
    gql`
      mutation UpdateAppearance($input: UpdateAppearanceInput!) {
        updateAppearance(input: $input) {
          theme
        }
      }
    `,
    options,
  );
}
