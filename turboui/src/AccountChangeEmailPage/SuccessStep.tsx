import React from "react";
import { PrimaryButton } from "../Button";

export function SuccessStep({ email, securityPath }: { email: string; securityPath: string }) {
  const heading = React.useRef<HTMLHeadingElement>(null);
  React.useEffect(() => heading.current?.focus(), []);

  return (
    <div data-test-id="email-change-success">
      <h1 ref={heading} tabIndex={-1} className="mb-3 text-content-accent text-3xl font-extrabold outline-none">
        Email changed
      </h1>
      <p>
        Your account email is now <strong className="break-all">{email}</strong>.
      </p>
      <p className="mt-3 mb-6 text-content-dimmed">
        It’s updated across all your companies. You’re still signed in. We’ll notify your previous address about this
        change.
      </p>
      <PrimaryButton linkTo={securityPath} size="sm" testId="email-change-done">
        Back to Password & Security
      </PrimaryButton>
    </div>
  );
}
