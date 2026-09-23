import React from "react";
import { useTranslation } from "react-i18next";
import { ResourceAccessContent, ResourceAccessContentProps } from "./ResourceAccessContent";

interface Props extends ResourceAccessContentProps {
  fullName: string;
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
        {t("{{name}} has been added to the company and an email has been sent to notify them.", { name: props.fullName })}
      </div>

      {props.isGuest && <ResourceAccessContent {...props} />}
    </div>
  );
}
