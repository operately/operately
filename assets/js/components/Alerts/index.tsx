import React from "react";

import { IconAlertTriangleFilled, IconCircleXFilled, IconInfoCircleFilled } from "@tabler/icons-react";

export function InfoAlert({ message, description }: { message: string | JSX.Element, description?: string | JSX.Element }) {
  return (
    <div className="rounded-md bg-blue-50 p-4">
      <div className="flex">
        <div className="flex-shrink-0">
          <IconInfoCircleFilled aria-hidden="true" className="h-5 w-5 text-blue-400" />
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-blue-800">{message}</h3>
          {description ? (
            <div className="mt-2 text-sm text-blue-700">
              <p>
                {description}
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export function WarningAlert({ message, description }: { message: string | JSX.Element, description?: string | JSX.Element }) {
  return (
    <div className="rounded-md bg-yellow-50 p-4">
      <div className="flex">
        <div className="flex-shrink-0">
          <IconAlertTriangleFilled aria-hidden="true" className="h-5 w-5 text-yellow-400" />
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-yellow-800">{message}</h3>
          {description ? (
            <div className="mt-2 text-sm text-yellow-700">
              <p>
                {description}
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export function ErrorAlert({ message, description }: { message: string | JSX.Element, description?: string | JSX.Element }) {
  return (
    <div className="rounded-md bg-red-50 p-4">
      <div className="flex">
        <div className="flex-shrink-0">
          <IconCircleXFilled aria-hidden="true" className="h-5 w-5 text-red-400" />
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-red-800">{message}</h3>
          {description ? (
            <div className="mt-2 text-sm text-red-700">
              <p>
                {description}
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
