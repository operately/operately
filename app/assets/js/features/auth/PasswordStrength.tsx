import * as React from "react";
import { useTranslation } from "react-i18next";
import { IconCheck, IconCircleFilled } from "turboui";

import classNames from "classnames";
import { validatePassword } from "./validatePassword";

export function PasswordStrength({ password }) {
  const { t } = useTranslation();

  if (password.length === 0) return null;

  const validation = validatePassword(password);

  if (validation.isValid) return null;

  return (
    <div className="text-sm font-medium flex flex-col gap-1">
      <CheckMark title={t("At least 12 characters")} ok={validation.hasMinLength} />
      <CheckMark title={t("At least 1 uppercase letter")} ok={validation.hasUpperCase} />
      <CheckMark title={t("At least 1 number")} ok={validation.hasNumber} />
      <CheckMark title={t("At least 1 lowercase")} ok={validation.hasLowerCase} />
    </div>
  );
}

function CheckMark({ title, ok }) {
  const icon = ok ? <IconCheck size={16} className="w-4" /> : <IconCircleFilled size={8} className="w-4" />;

  const className = classNames("flex items-center gap-2", {
    "text-accent-1": ok,
    "text-content-dimmed": !ok,
  });

  return (
    <div className={className}>
      {icon} {title}
    </div>
  );
}
