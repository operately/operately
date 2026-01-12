import React from "react";

import classname from "classnames";

interface TextInnputNoLabelProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  id: string;
  testId?: string;
  value: string;
  placeholder?: string;
  error?: boolean;
  autoFocus?: boolean;

  onChange: (value: string) => void;
  onEnter?: () => void;
}

export function TextInputNoLabel(props: TextInnputNoLabelProps) {
  const {
    id,
    testId,
    value,
    onChange,
    placeholder = "",
    error = false,
    autoFocus = false,
    onEnter = null,
    onKeyDown = null,
    ...rest
  } = props;

  const className = classname(
    "w-full bg-surface-base text-content-accent placeholder-content-subtle border rounded-lg px-3 py-1.5",
    {
      "border-surface-outline": !error,
      "border-red-500": error,
    },
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && props.onEnter) {
      props.onEnter();
    }
  };

  return (
    <input
      id={id}
      data-test-id={props.testId}
      className={className}
      type="text"
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={handleKeyDown}
      autoFocus={autoFocus}
      {...rest}
    />
  );
}
