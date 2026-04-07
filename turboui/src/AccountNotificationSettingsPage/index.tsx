import React from "react";

import { Dropdown } from "../forms/Dropdown";
import { Page } from "../Page";
import { PrimaryButton, SecondaryButton } from "../Button";
import { SwitchToggle } from "../SwitchToggle";
import { IconClockPlay, IconMail, IconMailFast } from "../icons";
import classNames from "../utils/classnames";

export namespace AccountNotificationSettingsPage {
  export type EmailWindowMinutes = 5 | 10 | 15 | 30 | 60;

  export interface Props {
    notifyOnMention: boolean;
    emailWindowMinutes: EmailWindowMinutes;
    sendDailySummary: boolean;
    onNotifyOnMentionChange: (value: boolean) => void;
    onEmailWindowMinutesChange: (value: EmailWindowMinutes) => void;
    onSendDailySummaryChange: (value: boolean) => void;
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

const WINDOW_OPTIONS: WindowOption[] = [
  { id: "5", name: "5 minutes", minutes: 5, testId: "email-window-minutes-option-5" },
  { id: "10", name: "10 minutes", minutes: 10, testId: "email-window-minutes-option-10" },
  { id: "15", name: "15 minutes", minutes: 15, testId: "email-window-minutes-option-15" },
  { id: "30", name: "30 minutes", minutes: 30, testId: "email-window-minutes-option-30" },
  { id: "60", name: "60 minutes", minutes: 60, testId: "email-window-minutes-option-60" },
];

export function AccountNotificationSettingsPage(props: AccountNotificationSettingsPage.Props) {
  const navigation = React.useMemo(
    () => [
      { to: props.homePath, label: "Home" },
      { to: props.settingsPath, label: "Settings" },
    ],
    [props.homePath, props.settingsPath],
  );

  const handleSubmit = React.useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      await props.onSubmit();
    },
    [props],
  );

  return (
    <Page title="Notification Settings" size="small" navigation={navigation} testId="account-notification-settings-page">
      <div className="px-4 sm:px-10 py-8">
        <header>
          <h1 className="text-2xl font-bold">Notification settings</h1>
          <p className="text-sm text-content-dimmed mt-2">
            Activity emails are always buffered. You can choose whether direct mentions should also stay buffered or arrive
            right away.
          </p>
        </header>

        <form className="mt-8 space-y-8" onSubmit={handleSubmit}>
          <section>
            <div className="font-bold text-sm">Activity emails</div>
            <div className="text-sm text-content-dimmed mt-1">
              Choose how direct mentions should be delivered.
            </div>

            <div className="mt-4 grid gap-3">
              <PreferenceCard
                title="Buffered notifications"
                description="All activity emails wait for the buffer window, are grouped together, and sent as a single email."
                selected={!props.notifyOnMention}
                onClick={() => props.onNotifyOnMentionChange(false)}
                testId="email-preference-buffered"
                icon={<IconMail size={20} />}
              />

              <PreferenceCard
                title="Direct mentions are instant"
                description="Emails for direct mentions are sent right away. All other activity emails wait for the buffer window and are sent as a single email."
                selected={props.notifyOnMention}
                onClick={() => props.onNotifyOnMentionChange(true)}
                testId="email-preference-mentions-only"
                icon={<IconMailFast size={20} />}
              />
            </div>
          </section>

          <section>
            <div className="font-bold text-sm">Buffer window</div>
            <div className="text-sm text-content-dimmed mt-1">
              Choose how long Operately should wait before sending buffered activity emails. When direct mentions are
              instant, this still applies to all other activity emails.
            </div>

            <div className="mt-4 max-w-xs">
              <Dropdown
                items={WINDOW_OPTIONS}
                value={String(props.emailWindowMinutes)}
                onSelect={(item) => props.onEmailWindowMinutesChange(item.minutes)}
                testId="email-window-minutes-dropdown"
              />
            </div>
          </section>

          <section className="rounded-lg border border-surface-outline bg-surface-dimmed p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="pr-6">
                <div className="font-bold text-sm flex items-center gap-2">
                  <IconClockPlay size={18} />
                  Daily summary
                </div>
                <div className="text-sm text-content-dimmed mt-1">
                  Send one summary email at the end of your workday.
                </div>
              </div>

              <SwitchToggle
                label="Send daily summary"
                value={props.sendDailySummary}
                setValue={props.onSendDailySummaryChange}
                testId={props.sendDailySummary ? "disable-daily-summary-toggle" : "enable-daily-summary-toggle"}
                labelHidden
              />
            </div>
          </section>

          <div className="flex justify-end gap-2">
            <SecondaryButton type="button" onClick={props.onCancel} disabled={props.isSubmitting}>
              Cancel
            </SecondaryButton>

            <PrimaryButton type="submit" loading={props.isSubmitting} testId="save-notification-settings">
              Save Changes
            </PrimaryButton>
          </div>
        </form>
      </div>
    </Page>
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
