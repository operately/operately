import React from "react";
import { useTranslation } from "react-i18next";

import { Input, InputProps } from "./Input";
import { InputField } from "./FieldGroup";
import { useFieldError, useFieldValue, useFormContext } from "./context";
import { useValidation } from "./validation";

export interface VerificationCodeInputProps extends Pick<
  InputProps,
  "autoFocus" | "className" | "placeholder" | "testId" | "aria-describedby"
> {
  field: string;
  label?: string;
}

const COMPLETE_CODE = /^[A-Z0-9]{6}$/;
const PARTIAL_CODE = /^[A-Z0-9]{0,6}$/;
const GROUPED_CODE = /^[A-Z0-9]{3}-[A-Z0-9]{3}$/;

export function VerificationCodeInput({ field, label, ...inputProps }: VerificationCodeInputProps) {
  const { t } = useTranslation();
  const [value = "", setValue] = useFieldValue<string>(field);
  const error = useFieldError(field);
  const form = useFormContext();
  // A rejected edit must block submission even when the retained value is complete.
  const rejectedEdit = React.useRef(false);
  const message = t("Enter exactly six characters using uppercase letters (A–Z) or digits (0–9).");

  useValidation(field, (name, code, addError) => {
    if (rejectedEdit.current || typeof code !== "string" || !COMPLETE_CODE.test(code)) {
      addError(name, message);
    }
  });

  const rejectEdit = () => {
    rejectedEdit.current = true;
    form.actions.addErrors({ [field]: message });
  };

  const acceptEdit = (nextValue: string) => {
    rejectedEdit.current = false;
    form.actions.removeErrors([field]);
    setValue(nextValue);
  };

  const pasteCode = (event: React.ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    const pasted = event.clipboardData.getData("text").trim();
    const code = GROUPED_CODE.test(pasted) ? pasted.replace("-", "") : pasted;
    const input = event.currentTarget;
    const start = input.selectionStart ?? value.length;
    const end = input.selectionEnd ?? start;
    const nextValue = value.slice(0, start) + code + value.slice(end);

    if (!COMPLETE_CODE.test(code) || !COMPLETE_CODE.test(nextValue)) {
      rejectEdit();
      return;
    }

    acceptEdit(nextValue);
  };

  return (
    <InputField field={field} label={label} error={error}>
      <Input
        {...inputProps}
        id={field}
        field={field}
        type="text"
        autoComplete="one-time-code"
        autoCapitalize="characters"
        spellCheck={false}
        value={value}
        error={Boolean(error)}
        onChange={(event) => {
          if (PARTIAL_CODE.test(event.target.value)) acceptEdit(event.target.value);
          else rejectEdit();
        }}
        onPaste={pasteCode}
        onEnter={(event) => {
          event.preventDefault();
          void form.actions.submit();
        }}
      />
    </InputField>
  );
}
