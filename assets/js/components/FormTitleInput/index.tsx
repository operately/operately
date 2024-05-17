import * as React from "react";

import classnames from "classnames";

interface FormTitleInputProps {
  value: string;
  onChange: (value: string) => void;
  error: boolean;
  testID?: string;
}

export function FormTitleInput({ value, onChange, error, testID }: FormTitleInputProps) {
  const className = classnames(
    "bg-surface",
    "text-3xl",
    "font-semibold",
    "border-none",
    "outline-none",
    "focus:outline-none",
    "focus:ring-0",
    "px-0 py-1",
    "w-full",
    "resize-none",
    "ring-0",
    "placeholder:text-content-subtle",
    "leading-wide",
    { "bg-red-400/10": error },
  );

  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  React.useEffect(() => {
    if (!textareaRef.current) return;

    textareaRef.current.style.height = "0px";
    const scrollHeight = textareaRef.current.scrollHeight;
    textareaRef.current.style.height = scrollHeight + "px";
  }, [value]);

  return (
    <textarea
      ref={textareaRef}
      autoFocus
      className={className}
      placeholder="Title&hellip;"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      data-test-id={testID}
    ></textarea>
  );
}
