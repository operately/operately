import * as React from "react";
import { useTranslation } from "react-i18next";

import { ErrorMessage } from "./ErrorMessage";
import { useFormContext } from "./context";
import { translationText } from "../i18n";
import type { FormErrorProps } from "./types";

export function FormError({ message, when, className }: FormErrorProps) {
  const { t } = useTranslation();
  const form = useFormContext();
  const shouldShow = when ?? form.hasErrors;

  if (!shouldShow) {
    return null;
  }

  return (
    <div className={className}>
      <ErrorMessage error={message ?? translationText(t("Please fix the errors above."))} />
    </div>
  );
}
