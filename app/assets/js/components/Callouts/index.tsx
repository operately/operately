import React from "react";
import { TestableElement } from "@/utils/testid";

import { IconAlertTriangleFilled, IconCircleCheckFilled, IconCircleXFilled, IconInfoCircleFilled } from "turboui";

interface Props extends TestableElement {
  message: string | JSX.Element;
  description?: string | JSX.Element;
}

export function InfoCallout(props: Props) {
  return (
    <UnstyledCallout
      {...props}
      icon={IconInfoCircleFilled}
      iconClassName="text-callout-info-content"
      backgroundColor="bg-callout-info-bg"
      titleColor="text-callout-info-content"
      messageColor="text-callout-info-content"
    />
  );
}

export function WarningCallout(props: Props) {
  return (
    <UnstyledCallout
      {...props}
      icon={IconAlertTriangleFilled}
      iconClassName="text-callout-warning-content"
      backgroundColor="bg-callout-warning-bg"
      titleColor="text-callout-warning-content"
      messageColor="text-callout-warning-content"
    />
  );
}

export function ErrorCallout(props: Props) {
  return (
    <UnstyledCallout
      {...props}
      icon={IconCircleXFilled}
      iconClassName="text-callout-error-content"
      backgroundColor="bg-callout-error-bg"
      titleColor="text-callout-error-content"
      messageColor="text-callout-error-content"
    />
  );
}

export function SuccessCallout(props: Props) {
  return (
    <UnstyledCallout
      {...props}
      icon={IconCircleCheckFilled}
      iconClassName="text-callout-success-content"
      backgroundColor="bg-callout-success-bg"
      titleColor="text-callout-success-content"
      messageColor="text-callout-success-content"
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
