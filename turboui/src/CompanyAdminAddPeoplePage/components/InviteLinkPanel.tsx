import React from "react";
import { useTranslation } from "react-i18next";

import { CopyToClipboard } from "../../CopyToClipboard";
import classNames from "../../utils/classnames";

export namespace InviteLinkPanel {
  export interface Props {
    link: string;
    invitationMessage?: string;
    description?: React.ReactNode;
    footer?: React.ReactNode;
    className?: string;
    testId?: string;
  }
}

export function InviteLinkPanel(props: InviteLinkPanel.Props) {
  const { t } = useTranslation();

  return (
    <div className={classNames("mt-4", props.className)}>
      {props.description && <div className="max-w-2xl text-sm leading-6 text-content-dimmed">{props.description}</div>}

      <div
        className="mt-6 flex items-start gap-3 rounded-lg border border-surface-outline bg-surface-dimmed p-4 sm:p-5"
        data-test-id={props.testId}
      >
        <p className="min-w-0 flex-1 break-words text-sm font-normal leading-6 text-content-base">
          {(props.invitationMessage ?? props.link).split(props.link).map((part, index) => (
            <React.Fragment key={index}>
              {index > 0 && <span className="mt-3 block break-all text-content-dimmed">{props.link}</span>}
              {part}
            </React.Fragment>
          ))}
        </p>
        <CopyToClipboard
          text={props.invitationMessage ?? props.link}
          size={20}
          padding={2}
          className="shrink-0 text-content-dimmed"
          ariaLabel={props.invitationMessage ? t("Copy message") : t("Copy link")}
        />
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        {props.footer && <div className="text-xs leading-5 text-content-dimmed">{props.footer}</div>}
        {props.invitationMessage && (
          <CopyToClipboard text={props.link} size={20} label={t("Copy link")} className="min-h-8" />
        )}
      </div>
    </div>
  );
}
