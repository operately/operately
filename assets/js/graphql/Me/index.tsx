import { useMutation, gql } from "@apollo/client";

import { Project } from "@/models/projects";

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

export function logIn(email: string, password: string) {
  const csrfToken = document.querySelector<HTMLMetaElement>("meta[name=csrf-token]")?.content;

  const headers = {
    "x-csrf-token": csrfToken,
    "Content-Type": "application/json",
  } as HeadersInit;

  const data = {
    email,
    password,
  };

  return fetch("/accounts/log_in", {
    method: "POST",
    headers: headers,
    body: JSON.stringify(data),
  });
}

export function useProfileMutation(options = {}) {
  return useMutation(
    gql`
      mutation UpdateProfile($input: UpdateProfileInput!) {
        updateProfile(input: $input) {
          fullName
          title
          timezone
          avatarUrl
        }
      }
    `,
    options,
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
    options,
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
