import React from "react";
import type { TFunction } from "i18next";
import { useTranslation } from "react-i18next";

import { Dropdown } from "../FormElements/Dropdown";
import { Page } from "../Page";
import { PrimaryButton, SecondaryButton } from "../Button";
import { SwitchToggle } from "../SwitchToggle";
import { IconChecklist, IconClockPlay, IconMail, IconMailFast } from "../icons";
import { translationText } from "../i18n";
import classNames from "../utils/classnames";

export namespace AccountNotificationSettingsPage {
  export type EmailWindowMinutes = 5 | 10 | 15 | 30 | 60;
  export type DailySummaryDeliveryTime = string;

  export interface Props {
    notifyOnMention: boolean;
    emailWindowMinutes: EmailWindowMinutes;
    sendDailySummary: boolean;
    dailySummaryDeliveryTime: DailySummaryDeliveryTime;
    onNotifyOnMentionChange: (value: boolean) => void;
    onEmailWindowMinutesChange: (value: EmailWindowMinutes) => void;
    onSendDailySummaryChange: (value: boolean) => void;
    onDailySummaryDeliveryTimeChange: (value: DailySummaryDeliveryTime) => void;
    notifyAboutAssignments: boolean;
    onNotifyAboutAssignmentsChange: (value: boolean) => void;
    onSubmit: () => Promise<void>;
    onCancel: () => void;
    isSubmitting?: boolean;
    homePath: string;
    settingsPath: string;
  }
}

interface WindowOption extends Dropdown.Item {
  minutes: AccountNotificationSettingsPage.EmailWindowMinutes;
}

interface DailySummaryTimeOption extends Dropdown.Item {
  value: AccountNotificationSettingsPage.DailySummaryDeliveryTime;
}

export function AccountNotificationSettingsPage(props: AccountNotificationSettingsPage.Props) {
  const { t } = useTranslation();
  const navigation = React.useMemo(
    () => [
      { to: props.homePath, label: t("Home") },
      { to: props.settingsPath, label: t("Settings") },
    ],
    [props.homePath, props.settingsPath, t],
  );

  const windowOptions: WindowOption[] = [
    { id: "5", name: t("5 minutes"), minutes: 5, testId: "email-window-minutes-option-5" },
    { id: "10", name: t("10 minutes"), minutes: 10, testId: "email-window-minutes-option-10" },
    { id: "15", name: t("15 minutes"), minutes: 15, testId: "email-window-minutes-option-15" },
    { id: "30", name: t("30 minutes"), minutes: 30, testId: "email-window-minutes-option-30" },
    { id: "60", name: t("60 minutes"), minutes: 60, testId: "email-window-minutes-option-60" },
  ];

  const handleSubmit = React.useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      await props.onSubmit();
    },
    [props],
  );

  return (
    <Page
      title={translationText(t("Notification Settings"))}
      size="small"
      navigation={navigation}
      testId="account-notification-settings-page"
    >
      <div className="px-4 sm:px-10 py-8">
        <header>
          <h1 className="text-2xl font-bold">{t("Notification settings")}</h1>
          <p className="text-sm text-content-dimmed mt-2">
            {t(
              "Activity emails are always batched. You can choose whether direct mentions should also be batched or arrive right away.",
            )}
          </p>
        </header>

        <form className="mt-8 space-y-8" onSubmit={handleSubmit}>
          <section>
            <div className="font-bold text-sm">{t("Activity emails")}</div>
            <div className="text-sm text-content-dimmed mt-1">
              {t("Choose how direct mentions should be delivered.")}
            </div>

            <div className="mt-4 grid gap-3">
              <PreferenceCard
                title={t("Batched notifications")}
                description={t(
                  "All activity emails wait for the batch window, are grouped together, and sent as a single email.",
                )}
                selected={!props.notifyOnMention}
                onClick={() => props.onNotifyOnMentionChange(false)}
                testId="email-preference-buffered"
                icon={<IconMail size={20} />}
              />

              <PreferenceCard
                title={t("Direct mentions are instant")}
                description={t(
                  "Emails for direct mentions are sent right away. All other activity emails wait for the batch window and are sent as a single email.",
                )}
                selected={props.notifyOnMention}
                onClick={() => props.onNotifyOnMentionChange(true)}
                testId="email-preference-mentions-only"
                icon={<IconMailFast size={20} />}
              />
            </div>
          </section>

          <section>
            <div className="font-bold text-sm">{t("Batch window")}</div>
            <div className="text-sm text-content-dimmed mt-1">
              {t(
                "Choose how long Operately should wait before sending batched activity emails. When direct mentions are instant, this still applies to all other activity emails.",
              )}
            </div>

            <div className="mt-4 max-w-xs">
              <Dropdown
                items={windowOptions}
                value={String(props.emailWindowMinutes)}
                onSelect={(item) => props.onEmailWindowMinutesChange(item.minutes)}
                testId="email-window-minutes-dropdown"
              />
            </div>
          </section>

          <DailySummarySection
            sendDailySummary={props.sendDailySummary}
            dailySummaryDeliveryTime={props.dailySummaryDeliveryTime}
            onSendDailySummaryChange={props.onSendDailySummaryChange}
            onDailySummaryDeliveryTimeChange={props.onDailySummaryDeliveryTimeChange}
          />

          <AssignmentsEmailSection
            notifyAboutAssignments={props.notifyAboutAssignments}
            onNotifyAboutAssignmentsChange={props.onNotifyAboutAssignmentsChange}
          />

          <div className="flex justify-end gap-2">
            <SecondaryButton type="button" onClick={props.onCancel} disabled={props.isSubmitting}>
              {t("Cancel")}
            </SecondaryButton>

            <PrimaryButton type="submit" loading={props.isSubmitting} testId="save-notification-settings">
              {t("Save Changes")}
            </PrimaryButton>
          </div>
        </form>
      </div>
    </Page>
  );
}

function formatDailySummaryHourLabel(hour: number, t: TFunction) {
  if (hour === 0) return t("12:00 AM");
  if (hour < 12) return t("{{hour}}:00 AM", { hour });
  if (hour === 12) return t("12:00 PM");

  return t("{{hour}}:00 PM", { hour: hour - 12 });
}

function DailySummarySection({
  sendDailySummary,
  dailySummaryDeliveryTime,
  onSendDailySummaryChange,
  onDailySummaryDeliveryTimeChange,
}: {
  sendDailySummary: boolean;
  dailySummaryDeliveryTime: AccountNotificationSettingsPage.DailySummaryDeliveryTime;
  onSendDailySummaryChange: (value: boolean) => void;
  onDailySummaryDeliveryTimeChange: (value: AccountNotificationSettingsPage.DailySummaryDeliveryTime) => void;
}) {
  const { t } = useTranslation();
  const dailySummaryTimeOptions: DailySummaryTimeOption[] = Array.from({ length: 24 }, (_, hour) => {
    const value = `${String(hour).padStart(2, "0")}:00`;

    return {
      id: value,
      value,
      name: formatDailySummaryHourLabel(hour, t),
      testId: `daily-summary-delivery-time-option-${value}`,
    };
  });

  return (
    <section className="rounded-lg border border-surface-outline bg-surface-dimmed p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="pr-6">
          <div className="font-bold text-sm flex items-center gap-2">
            <IconClockPlay size={18} />
            {t("Daily summary")}
          </div>
          <div className="text-sm text-content-dimmed mt-1">
            {t("Send one summary email at the end of your workday.")}
          </div>
        </div>

        <SwitchToggle
          label={translationText(t("Send daily summary"))}
          value={sendDailySummary}
          setValue={onSendDailySummaryChange}
          testId={sendDailySummary ? "disable-daily-summary-toggle" : "enable-daily-summary-toggle"}
          labelHidden
        />
      </div>

      {sendDailySummary && (
        <div className="mt-4 max-w-xs">
          <div className="text-xs text-content-dimmed mb-1">{t("Delivery time")}</div>
          <Dropdown
            items={dailySummaryTimeOptions}
            value={dailySummaryDeliveryTime}
            onSelect={(item) => onDailySummaryDeliveryTimeChange(item.value)}
            testId="daily-summary-delivery-time-dropdown"
          />
        </div>
      )}
    </section>
  );
}

function AssignmentsEmailSection({
  notifyAboutAssignments,
  onNotifyAboutAssignmentsChange,
}: {
  notifyAboutAssignments: boolean;
  onNotifyAboutAssignmentsChange: (value: boolean) => void;
}) {
  const { t } = useTranslation();

  return (
    <section className="rounded-lg border border-surface-outline bg-surface-dimmed p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="pr-6">
          <div className="font-bold text-sm flex items-center gap-2">
            <IconChecklist size={18} />
            {t("Assignments email")}
          </div>
          <div className="text-sm text-content-dimmed mt-1">
            {t(
              "Receive a daily email with your upcoming check-ins, reviews, and other work that needs your attention.",
            )}
          </div>
        </div>

        <SwitchToggle
          label={translationText(t("Send assignments email"))}
          value={notifyAboutAssignments}
          setValue={onNotifyAboutAssignmentsChange}
          testId={notifyAboutAssignments ? "disable-assignments-email-toggle" : "enable-assignments-email-toggle"}
          labelHidden
        />
      </div>
    </section>
  );
}

function PreferenceCard({
  title,
  description,
  selected,
  onClick,
  testId,
  icon,
}: {
  title: string;
  description: string;
  selected: boolean;
  onClick: () => void;
  testId: string;
  icon: React.ReactNode;
}) {
  return (
    <button
      type="button"
      className={classNames("w-full rounded-lg border p-4 text-left transition-colors", {
        "border-brand-1 bg-surface-dimmed": selected,
        "border-surface-outline hover:bg-surface-dimmed": !selected,
      })}
      onClick={onClick}
      data-test-id={testId}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 text-content-dimmed">{icon}</div>

        <div className="flex-1">
          <div className="flex items-center justify-between gap-4">
            <div className="font-bold text-sm">{title}</div>
            <SelectionIndicator selected={selected} />
          </div>

          <div className="text-sm text-content-dimmed mt-1">{description}</div>
        </div>
      </div>
    </button>
  );
}

function SelectionIndicator({ selected }: { selected: boolean }) {
  return (
    <div
      className={classNames("flex h-4 w-4 items-center justify-center rounded-full border", {
        "border-brand-1": selected,
        "border-surface-outline": !selected,
      })}
    >
      {selected && <div className="h-2 w-2 rounded-full bg-brand-1" />}
    </div>
  );
}

export default AccountNotificationSettingsPage;
