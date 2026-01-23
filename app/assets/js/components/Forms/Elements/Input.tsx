import React from "react";

import classNames from "classnames";
import { IconCheck } from "turboui";

interface Props extends React.InputHTMLAttributes<HTMLInputElement> {
  field?: string;
  testId?: string;
  error?: boolean;
  onEnter?: (e: React.KeyboardEvent) => void;
  okSign?: boolean;
  className?: string;
}

export function InputElement(props: Props) {
  const { field, testId, error, onEnter, ...rest } = props;
  return (
    <div className="relative">
      <input
        {...rest}
        name={field}
        data-test-id={testId}
        className={styles(error, props.className)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && onEnter) {
            onEnter(e);
          }
        }}
        //
        // The standard autoFocus works if the input is rendered outside of a modal.
        // However, if the input is inside of a modal, the autoFocus prop does not work.
        //
        // To handle this edge case, we set the data-autofocus attribute to true, and then
        // in the component/Modal, we use a onOpen callback to focus the input field
        // with the data-autofocus attribute.
        //
        autoFocus={props.autoFocus}
        data-autofocus={props.autoFocus}
      />

      {!error && props.okSign && (
        <div className="absolute inset-y-0 right-0 flex items-center pr-4 text-accent-1">
          <IconCheck size={20} />
        </div>
      )}
    </div>
  );
}

function styles(error: boolean | undefined, className?: string) {
  return classNames(
    {
      "w-full": true,
      "bg-surface-base text-content-accent placeholder-content-subtle": true,
      "border rounded-lg": true,
      "px-3 py-1.5": true,
      "border-surface-outline": !error,
      "border-red-500": error,
    },
    className,
  );
}
