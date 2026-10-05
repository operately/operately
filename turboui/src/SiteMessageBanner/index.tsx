import React from "react";
import { useTranslation } from "react-i18next";
import { IconX } from "../icons";
import { UnstyledButton } from "../Button/UnstalyedButton";

export namespace SiteMessageBanner {
  export interface Props {
    title: string;
    description: React.ReactNode;
    onDismiss: () => void;
  }
}

export function SiteMessageBanner({ title, description, onDismiss }: SiteMessageBanner.Props) {
  const { t } = useTranslation();

  return (
    <div
      className="border-b border-surface-outline bg-yellow-50 text-yellow-950"
      data-test-id="site-message-banner"
      role="status"
      aria-live="polite"
    >
      <div className="mx-auto flex max-w-7xl items-start justify-between gap-4 px-4 py-3">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <div className="min-w-0 flex-1 text-sm leading-6 text-yellow-950">
            <span className="font-semibold text-black opacity-95">{title}:</span> {description}
          </div>
        </div>

        <UnstyledButton
          type="button"
          className="mt-0.5 shrink-0 rounded-md p-1 text-yellow-700 transition-colors hover:bg-yellow-100 hover:text-yellow-900"
          testId="site-message-banner-dismiss"
          ariaLabel={t("Dismiss message")}
          onClick={onDismiss}
        >
          <IconX size={18} />
        </UnstyledButton>
      </div>
    </div>
  );
}
