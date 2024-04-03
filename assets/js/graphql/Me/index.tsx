import { useMutation, gql } from "@apollo/client";

import { Project } from "@/models/projects";
import { GetMeDocument } from "@/gql";

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
      refetchQueries: [
        {
          query: GetMeDocument,
          variables: {
            includeManager: true,
          },
        },
      ],
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
      refetchQueries: [
        {
          query: GetMeDocument,
          variables: {
            includeManager: true,
          },
        },
      ],
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
