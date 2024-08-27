import React from "react";
import { TestableElement } from "@/utils/testid";

import { IconAlertTriangleFilled, IconCircleXFilled, IconInfoCircleFilled } from "@tabler/icons-react";

interface Props extends TestableElement {
  message: string | JSX.Element;
  description?: string | JSX.Element;
}

export function InfoAlert(props: Props) {
  return (
    <div data-test-id={props.testId} className="rounded-md bg-blue-50 p-4">
      <div className="flex">
        <div className="flex-shrink-0">
          <IconInfoCircleFilled aria-hidden="true" className="h-5 w-5 text-blue-400" />
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-blue-800">{props.message}</h3>
          {props.description ? (
            <div className="mt-2 text-sm text-blue-700">
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

export function WarningAlert(props: Props) {
  return (
    <div data-test-id={props.testId} className="rounded-md bg-yellow-50 p-4">
      <div className="flex">
        <div className="flex-shrink-0">
          <IconAlertTriangleFilled aria-hidden="true" className="h-5 w-5 text-yellow-400" />
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-yellow-800">{props.message}</h3>
          {props.description ? (
            <div className="mt-2 text-sm text-yellow-700">
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

export function ErrorAlert(props: Props) {
  return (
    <div data-test-id={props.testId} className="rounded-md bg-red-50 p-4">
      <div className="flex">
        <div className="flex-shrink-0">
          <IconCircleXFilled aria-hidden="true" className="h-5 w-5 text-red-400" />
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-red-800">{props.message}</h3>
          {props.description ? (
            <div className="mt-2 text-sm text-red-700">
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
