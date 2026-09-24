import React from "react";
import { useTranslation } from "react-i18next";

import { Page } from "../Page";
import { OptionsMenuItem } from "../OptionsMenuItem";
import { IconCode, IconLockPassword, IconRobotFace, IconMail } from "../icons";
import { translationText } from "../i18n";

export namespace AccountSecurityPage {
  export interface Props {
    homePath: string;
    changePasswordPath: string;
    changeEmailPath: string;
    apiTokensPath: string;
    mcpConnectionsPath: string;
  }
}

export function AccountSecurityPage(props: AccountSecurityPage.Props) {
  const { t } = useTranslation();
  const navigation = React.useMemo(() => [{ to: props.homePath, label: t("Home") }], [props.homePath, t]);

  return (
    <Page title={translationText(t("Password & Security"))} size="small" testId="account-security-page" navigation={navigation}>
      <div className="px-4 sm:px-10 py-8">
        <div className="mb-2 text-content-accent text-3xl font-extrabold">{t("Password & Security")}</div>
        <p className="mb-8">{t("Manage how you sign in and grant access to Operately.")}</p>

        <OptionsMenuItem
          linkTo={props.changeEmailPath}
          icon={IconMail}
          title={translationText(t("Change email"))}
          description={translationText(t("Update your email across all your companies"))}
        />
        <OptionsMenuItem
          linkTo={props.changePasswordPath}
          icon={IconLockPassword}
          title={translationText(t("Change password"))}
          description={translationText(t("Update the password you use to sign in"))}
        />
        <OptionsMenuItem
          linkTo={props.apiTokensPath}
          icon={IconCode}
          title={translationText(t("API tokens"))}
          description={translationText(t("Create and manage tokens for programmatic access"))}
        />
        <OptionsMenuItem
          linkTo={props.mcpConnectionsPath}
          icon={IconRobotFace}
          title={translationText(t("MCP connections"))}
          description={translationText(t("Review and revoke AI client connections"))}
        />
      </div>
    </Page>
  );
}
