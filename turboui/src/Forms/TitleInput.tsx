import * as React from "react";

import { createTestId } from "../TestableElement";
import classNames from "../utils/classnames";
import { useFieldError, useFieldValue } from "./context";
import { InputField } from "./FieldGroup";
import type { TitleInputProps } from "./types";
import { useValidation, validatePresence, validateTextLength } from "./validation";

const DEFAULT_VALIDATION_PROPS = {
  minLength: undefined,
  maxLength: undefined,
};

export function TitleInput(props: TitleInputProps) {
  const { field, placeholder } = props;
  const { minLength, maxLength } = { ...DEFAULT_VALIDATION_PROPS, ...props };
  const [value, setValue] = useFieldValue<string>(field);
  const error = useFieldError(field);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  useValidation(field, validatePresence(true, props.errorMessage));
  useValidation(field, validateTextLength(minLength, maxLength));

  React.useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) {
      return;
    }

    const resize = () => {
      textarea.style.height = "auto";
      textarea.style.height = textarea.scrollHeight + "px";
    };

    textarea.addEventListener("input", resize);
    resize();

    return () => textarea.removeEventListener("input", resize);
  }, [props.readonly]);

  React.useEffect(() => {
    if (props.autoFocus && textareaRef.current && !props.readonly) {
      const timer = window.setTimeout(() => {
        textareaRef.current?.focus();
      }, 10);

      return () => window.clearTimeout(timer);
    }

    return;
  }, [props.autoFocus, props.readonly]);

  return (
    <InputField field={field} error={error}>
      {props.readonly ? (
        <div className={titleStyles(false, { fontBold: props.fontBold })}>{value}</div>
      ) : (
        <textarea
          ref={textareaRef}
          name={field}
          rows={1}
          autoFocus={props.autoFocus}
          placeholder={placeholder}
          data-test-id={props.testId ?? createTestId(field)}
          className={titleStyles(!!error, { fontBold: props.fontBold })}
          value={value ?? ""}
          onChange={(event) => setValue(event.target.value)}
        />
      )}
    </InputField>
  );
}

function titleStyles(error: boolean, opts: { fontBold?: boolean }) {
  return classNames(
    "bg-surface-base text-3xl border-none outline-none focus:outline-none focus:ring-0 px-0 py-1 w-full resize-none ring-0 placeholder:text-content-subtle leading-wide",
    error ? "border-red-500" : "border-surface-outline",
    opts.fontBold ? "font-bold" : "font-semibold",
  );
}
