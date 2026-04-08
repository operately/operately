import type { EmailWindowMinutes, PeopleUpdateInput, Person } from "@/api";

interface NotificationSettingsFormState {
  notifyOnMention: boolean;
  emailWindowMinutes: EmailWindowMinutes;
  sendDailySummary: boolean;
  dailySummaryDeliveryTime: string;
}

const DEFAULT_EMAIL_WINDOW_MINUTES: EmailWindowMinutes = 5;
const DEFAULT_DAILY_SUMMARY_DELIVERY_TIME = "18:00";

export function getNotificationSettingsFormState(
  person: Pick<Person, "notifyOnMention" | "emailWindowMinutes" | "sendDailySummary" | "dailySummaryDeliveryTime">,
): NotificationSettingsFormState {
  return {
    notifyOnMention: person.notifyOnMention ?? false,
    emailWindowMinutes: person.emailWindowMinutes ?? DEFAULT_EMAIL_WINDOW_MINUTES,
    sendDailySummary: person.sendDailySummary ?? true,
    dailySummaryDeliveryTime: person.dailySummaryDeliveryTime ?? DEFAULT_DAILY_SUMMARY_DELIVERY_TIME,
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
    dailySummaryDeliveryTime: values.dailySummaryDeliveryTime,
  };
}
