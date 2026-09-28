import React from "react";
import { useTranslation } from "react-i18next";

import { Page } from "../Page";
import { OptionsMenuItem } from "../OptionsMenuItem";
import { IconBell, IconPalette } from "../icons";
import { translationText } from "../i18n";

export namespace AccountSettingsPage {
  export interface Props {
    homePath: string;
    appearancePath: string;
    notificationSettingsPath: string;
  }
}

export function AccountSettingsPage(props: AccountSettingsPage.Props) {
  const { t } = useTranslation();
  const navigation = React.useMemo(() => [{ to: props.homePath, label: t("Home") }], [props.homePath, t]);

  return (
    <Page title={translationText(t("Settings"))} size="small" testId="account-settings-page" navigation={navigation}>
      <div className="px-4 sm:px-10 py-8">
        <div className="mb-2 text-content-accent text-3xl font-extrabold">{t("Settings")}</div>
        <p className="mb-8">{t("Manage the account settings available to you.")}</p>

        <OptionsMenuItem
          linkTo={props.appearancePath}
          icon={IconPalette}
          title={translationText(t("Appearance"))}
          description={translationText(t("Adjust how Operately looks for you"))}
        />
        <OptionsMenuItem
          linkTo={props.notificationSettingsPath}
          icon={IconBell}
          title={translationText(t("Notification settings"))}
          description={translationText(t("Configure how activity and summary emails are delivered"))}
        />
      </div>
    </Page>
  );
}
