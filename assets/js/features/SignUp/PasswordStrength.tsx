import * as React from "react";
import * as Icons from "@tabler/icons-react";
import classNames from "classnames";

export function PasswordStrength({ password }) {
  if (password.length === 0) return null;

  const atLeast12Characters = password.length >= 12;
  const atLeast1Uppercase = /[A-Z]/.test(password);
  const atLeast1Number = /[0-9]/.test(password);
  const atLeast1Lowercase = /[a-z]/.test(password);

  if (atLeast12Characters && atLeast1Uppercase && atLeast1Number && atLeast1Lowercase) return null;

  return (
    <div className="text-sm font-medium flex flex-col gap-1">
      <CheckMark title="At least 12 characters" ok={atLeast12Characters} />
      <CheckMark title="At least 1 uppercase letter" ok={atLeast1Uppercase} />
      <CheckMark title="At least 1 number" ok={atLeast1Number} />
      <CheckMark title="At least 1 lowercase" ok={atLeast1Lowercase} />
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
