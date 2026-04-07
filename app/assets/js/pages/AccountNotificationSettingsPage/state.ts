import type { EmailWindowMinutes, PeopleUpdateInput, Person } from "@/api";

interface NotificationSettingsFormState {
  notifyOnMention: boolean;
  emailWindowMinutes: EmailWindowMinutes;
  sendDailySummary: boolean;
}

const DEFAULT_EMAIL_WINDOW_MINUTES: EmailWindowMinutes = 5;

export function getNotificationSettingsFormState(
  person: Pick<Person, "notifyOnMention" | "emailWindowMinutes" | "sendDailySummary">,
): NotificationSettingsFormState {
  return {
    notifyOnMention: person.notifyOnMention ?? false,
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
    notifyOnMention: values.notifyOnMention,
    emailWindowMinutes: values.emailWindowMinutes,
    sendDailySummary: values.sendDailySummary,
  };
}
