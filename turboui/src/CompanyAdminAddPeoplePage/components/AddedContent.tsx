import React from "react";
import { useTranslation } from "react-i18next";
import { ResourceAccessContent, ResourceAccessContentProps } from "./ResourceAccessContent";

interface Props extends ResourceAccessContentProps {
  fullName: string;
  companyName: string;
  isGuest: boolean;
}

export function AddedContent(props: Props) {
  const { t } = useTranslation();

  return (
    <div>
      <div className="text-content-accent text-xl sm:text-2xl font-extrabold">
        {t("{{name}} has been added", { name: props.fullName })}
      </div>

      <div className="mt-4">
        {t("{{name}} already uses Operately. We've added them to {{company}} and notified them by email.", {
          name: props.fullName,
          company: props.companyName,
        })}
      </div>

      {props.isGuest && <ResourceAccessContent {...props} />}
    </div>
  );
}
