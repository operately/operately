import * as React from "react";
import * as Icons from "@tabler/icons-react";
import classNames from "classnames";

export interface PasswordValidation {
  isValid: boolean;
  hasMinLength: boolean;
  hasUpperCase: boolean;
  hasLowerCase: boolean;
  hasNumber: boolean;
}

export function validatePassword(password: string): PasswordValidation {
  return {
    hasMinLength: password.length >= 12,
    hasUpperCase: /[A-Z]/.test(password),
    hasLowerCase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    isValid: password.length >= 12 && /[A-Z]/.test(password) && /[a-z]/.test(password) && /[0-9]/.test(password),
  };
}

export function PasswordStrength({ password }) {
  if (password.length === 0) return null;

  const validation = validatePassword(password);

  if (validation.isValid) return null;

  return (
    <div className="text-sm font-medium flex flex-col gap-1">
      <CheckMark title="At least 12 characters" ok={validation.hasMinLength} />
      <CheckMark title="At least 1 uppercase letter" ok={validation.hasUpperCase} />
      <CheckMark title="At least 1 number" ok={validation.hasNumber} />
      <CheckMark title="At least 1 lowercase" ok={validation.hasLowerCase} />
    </div>
  );
}

function CheckMark({ title, ok }) {
  const icon = ok ? <Icons.IconCheck size={16} className="w-4" /> : <Icons.IconCircleFilled size={8} className="w-4" />;

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
