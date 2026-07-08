import React from "react";

import { Page } from "../Page";
import { OptionsMenuItem } from "../OptionsMenuItem";
import { IconBell, IconPalette } from "../icons";

export namespace AccountSettingsPage {
  export interface Props {
    homePath: string;
    appearancePath: string;
    notificationSettingsPath: string;
  }
}

export function AccountSettingsPage(props: AccountSettingsPage.Props) {
  const navigation = React.useMemo(
    () => [{ to: props.homePath, label: "Home" }],
    [props.homePath],
  );

  return (
    <Page title="Settings" size="small" testId="account-settings-page" navigation={navigation}>
      <div className="px-4 sm:px-10 py-8">
        <div className="mb-2 text-content-accent text-3xl font-extrabold">Settings</div>
        <p className="mb-8">Manage the account settings available to you.</p>

        <OptionsMenuItem
          linkTo={props.appearancePath}
          icon={IconPalette}
          title="Appearance"
          description="Adjust how Operately looks for you"
        />
        <OptionsMenuItem
          linkTo={props.notificationSettingsPath}
          icon={IconBell}
          title="Notification settings"
          description="Configure how activity and summary emails are delivered"
        />
      </div>
    </Page>
  );
}
