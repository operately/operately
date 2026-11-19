import React from "react";
import { useTranslation } from "react-i18next";
import { InviteLinkPanel } from "./InviteLinkPanel";
import { ResourceAccessContent, ResourceAccessContentProps } from "./ResourceAccessContent";

interface Props extends ResourceAccessContentProps {
  fullName: string;
  companyName: string;
  inviteLink: string;
  isGuest: boolean;
}

export function InvitedContent(props: Props) {
  const { t } = useTranslation();

  return (
    <div>
      <div className="text-content-accent text-xl sm:text-2xl font-bold leading-tight">
        {t("{{name}} has been invited by email", { name: props.fullName })}
      </div>

      <InviteLinkPanel
        link={props.inviteLink}
        invitationMessage={t(
          "Hi {{name}}, I've invited you to join {{company}} on Operately. Use this link to finish setting up your account: {{link}}",
          { name: props.fullName, company: props.companyName, link: props.inviteLink },
        )}
        description={t(
          "We've emailed {{name}} a link to finish setting up their account. You can also share it below.",
          { name: props.fullName },
        )}
        footer={t("This link (including the one in their email) expires in 24 hours.")}
      />

      {props.isGuest && <ResourceAccessContent {...props} />}
    </div>
  );
}
