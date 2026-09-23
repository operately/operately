import React from "react";
import { useTranslation } from "react-i18next";
import { InviteLinkPanel } from "../../InviteLinkPanel";
import { ResourceAccessContent, ResourceAccessContentProps } from "./ResourceAccessContent";

interface Props extends ResourceAccessContentProps {
  fullName: string;
  inviteLink: string;
  isGuest: boolean;
}

export function InvitedContent(props: Props) {
  const { t } = useTranslation();

  return (
    <div>
      <div className="text-content-accent text-xl sm:text-2xl font-extrabold">
        {t("{{name}} has been invited by email", { name: props.fullName })}
      </div>

      <InviteLinkPanel
        link={props.inviteLink}
        description={t(
          "They've received an email with this link. You can copy it here to share again if they didn't get the email or prefer another channel.",
        )}
        footer={t("This link (including the one in their email) expires in 24 hours.")}
      />

      {props.isGuest && <ResourceAccessContent {...props} />}
    </div>
  );
}
