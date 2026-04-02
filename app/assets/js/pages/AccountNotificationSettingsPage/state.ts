import type { EmailPreferenceValues, EmailWindowMinutes, PeopleUpdateInput, Person } from "@/api";

interface NotificationSettingsFormState {
  emailPreference: EmailPreferenceValues;
  emailWindowMinutes: EmailWindowMinutes;
  sendDailySummary: boolean;
}

const DEFAULT_EMAIL_PREFERENCE: EmailPreferenceValues = "buffered";
const DEFAULT_EMAIL_WINDOW_MINUTES: EmailWindowMinutes = 5;

export function getNotificationSettingsFormState(
  person: Pick<Person, "emailPreference" | "emailWindowMinutes" | "sendDailySummary">,
): NotificationSettingsFormState {
  return {
    emailPreference: person.emailPreference ?? DEFAULT_EMAIL_PREFERENCE,
    emailWindowMinutes: person.emailWindowMinutes ?? DEFAULT_EMAIL_WINDOW_MINUTES,
    sendDailySummary: person.sendDailySummary ?? true,
  };
}

export function buildNotificationSettingsUpdateInput(
  personId: string,
  values: NotificationSettingsFormState,
): PeopleUpdateInput {
  return {
    id: personId,
    emailPreference: values.emailPreference,
    emailWindowMinutes: values.emailWindowMinutes,
    sendDailySummary: values.sendDailySummary,
  };
}
