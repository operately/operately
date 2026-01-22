import React from "react";

import { CopyToClipboard } from "../CopyToClipboard";
import classNames from "../utils/classnames";

export namespace InviteLinkPanel {
  export interface Props {
    link: string;
    label?: string;
    description?: React.ReactNode;
    footer?: React.ReactNode;
    className?: string;
    testId?: string;
  }
}

export function InviteLinkPanel(props: InviteLinkPanel.Props) {
  return (
    <div className={classNames("mt-4", props.className)}>
      {props.description && <div>{props.description}</div>}

      <div className="mt-4 font-bold text-content-accent mb-1">{props.label ?? "Invitation Link"}</div>
      <div
        className="text-content-primary border border-surface-outline rounded-lg px-3 py-1 font-medium flex items-center justify-between"
        data-test-id={props.testId}
      >
        <span>{props.link}</span>
        <CopyToClipboard text={props.link} size={25} padding={1} />
      </div>

      {props.footer && <div className="mt-2">{props.footer}</div>}
    </div>
  );
}
