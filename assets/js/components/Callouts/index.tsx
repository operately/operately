import React from "react";
import { TestableElement } from "@/utils/testid";

import { IconAlertTriangleFilled, IconCircleCheckFilled, IconCircleXFilled, IconInfoCircleFilled } from "@tabler/icons-react";

interface Props extends TestableElement {
  message: string | JSX.Element;
  description?: string | JSX.Element;
}

export function InfoCallout(props: Props) {
  return (
    <div data-test-id={props.testId} className="rounded-md bg-callout-info p-4">
      <div className="flex">
        <div className="flex-shrink-0">
          <IconInfoCircleFilled aria-hidden="true" className="h-5 w-5 text-callout-info-icon" />
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-semibold text-callout-info-message">{props.message}</h3>
          {props.description ? (
            <div className="mt-2 text-sm text-callout-info-message">
              <p>
                {props.description}
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export function WarningCallout(props: Props) {
  return (
    <div data-test-id={props.testId} className="rounded-md bg-callout-warning p-4">
      <div className="flex">
        <div className="flex-shrink-0">
          <IconAlertTriangleFilled aria-hidden="true" className="h-5 w-5 text-callout-warning-icon" />
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-semibold text-callout-warning-message">{props.message}</h3>
          {props.description ? (
            <div className="mt-2 text-sm text-callout-warning-message">
              <p>
                {props.description}
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export function ErrorCallout(props: Props) {
  return (
    <div data-test-id={props.testId} className="rounded-md bg-callout-error p-4">
      <div className="flex">
        <div className="flex-shrink-0">
          <IconCircleXFilled aria-hidden="true" className="h-5 w-5 text-callout-error-icon" />
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-semibold text-callout-error-message">{props.message}</h3>
          {props.description ? (
            <div className="mt-2 text-sm text-callout-error-message">
              <p>
                {props.description}
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export function SuccessCallout(props: Props) {
  return (
    <div data-test-id={props.testId} className="rounded-md bg-callout-success p-4">
      <div className="flex">
        <div className="flex-shrink-0">
          <IconCircleCheckFilled aria-hidden="true" className="h-5 w-5 text-callout-success-icon" />
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-semibold text-callout-success-message">{props.message}</h3>
          {props.description ? (
            <div className="mt-2 text-sm text-callout-success-message">
              <p>
                {props.description}
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
