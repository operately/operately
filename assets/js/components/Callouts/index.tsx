import React from "react";
import { TestableElement } from "@/utils/testid";

import {
  IconAlertTriangleFilled,
  IconCircleCheckFilled,
  IconCircleXFilled,
  IconInfoCircleFilled,
} from "@tabler/icons-react";

interface Props extends TestableElement {
  message: string | JSX.Element;
  description?: string | JSX.Element;
}

export function InfoCallout(props: Props) {
  return (
    <UnstyledCallout
      {...props}
      icon={IconInfoCircleFilled}
      iconClassName="text-callout-info-icon"
      backgroundColor="bg-callout-info"
      titleColor="text-callout-info-message"
      messageColor="text-callout-info-message"
    />
  );
}

export function WarningCallout(props: Props) {
  return (
    <UnstyledCallout
      {...props}
      icon={IconAlertTriangleFilled}
      iconClassName="text-callout-warning-icon"
      backgroundColor="bg-callout-error"
      titleColor="text-callout-warning-message"
      messageColor="text-callout-warning-message"
    />
  );
}

export function ErrorCallout(props: Props) {
  return (
    <UnstyledCallout
      {...props}
      icon={IconCircleXFilled}
      iconClassName="text-callout-error-icon"
      backgroundColor="bg-callout-error"
      titleColor="text-callout-error-message"
      messageColor="text-callout-error-message"
    />
  );
}

export function SuccessCallout(props: Props) {
  return (
    <UnstyledCallout
      {...props}
      icon={IconCircleCheckFilled}
      iconClassName="text-callout-success-icon"
      backgroundColor="bg-callout-success"
      titleColor="text-callout-success-message"
      messageColor="text-callout-success-message"
    />
  );
}

interface Style {
  icon: any;
  iconClassName: string;
  backgroundColor: string;
  titleColor: string;
  messageColor: string;
}

function UnstyledCallout(props: Props & Style) {
  return (
    <div data-test-id={props.testId} className={`rounded-md ${props.backgroundColor} p-4`}>
      <div className="flex">
        <div className="flex-shrink-0">
          {React.createElement(props.icon, { "aria-hidden": true, className: props.iconClassName + " h-5 w-5" })}
        </div>
        <div className="ml-3">
          <h3 className={`text-sm font-semibold ${props.titleColor}`}>{props.message}</h3>
          {props.description ? <div className={`mt-2 text-sm ${props.messageColor}`}>{props.description}</div> : null}
        </div>
      </div>
    </div>
  );
}
