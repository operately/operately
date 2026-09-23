import React from "react";
import { useTranslation } from "react-i18next";

import { CopyToClipboard } from "../../CopyToClipboard";

export function InvitationUrl({ url, personName }: { url: string; personName: string }) {
  const { t } = useTranslation();

  return (
    <>
      <div className="mt-4">{t("Share this URL with {{name}} to invite them to the company:", { name: personName })}</div>
      <div className="text-content-primary border border-surface-outline rounded-lg px-3 py-1 font-medium flex items-center justify-between mt-2">
        <span className="break-all">{url}</span>
        <CopyToClipboard text={url} size={25} padding={1} />
      </div>
    </>
  );
}
