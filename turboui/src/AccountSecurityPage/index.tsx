import React from "react";

import { Page } from "../Page";
import { OptionsMenuItem } from "../OptionsMenuItem";
import { IconCode, IconLockPassword, IconRobotFace } from "../icons";

export namespace AccountSecurityPage {
  export interface Props {
    homePath: string;
    changePasswordPath: string;
    apiTokensPath: string;
    mcpConnectionsPath: string;
  }
}

export function AccountSecurityPage(props: AccountSecurityPage.Props) {
  const navigation = React.useMemo(
    () => [{ to: props.homePath, label: "Home" }],
    [props.homePath],
  );

  return (
    <Page title="Password & Security" size="small" testId="account-security-page" navigation={navigation}>
      <div className="px-4 sm:px-10 py-8">
        <div className="mb-2 text-content-accent text-3xl font-extrabold">Password & Security</div>
        <p className="mb-8">Manage how you sign in and grant access to Operately.</p>

        <OptionsMenuItem
          linkTo={props.changePasswordPath}
          icon={IconLockPassword}
          title="Change password"
          description="Update the password you use to sign in"
        />
        <OptionsMenuItem
          linkTo={props.apiTokensPath}
          icon={IconCode}
          title="API tokens"
          description="Create and manage tokens for programmatic access"
        />
        <OptionsMenuItem
          linkTo={props.mcpConnectionsPath}
          icon={IconRobotFace}
          title="MCP connections"
          description="Review and revoke AI client connections"
        />
      </div>
    </Page>
  );
}
