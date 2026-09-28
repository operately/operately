import React from "react";
import { Trans, useTranslation } from "react-i18next";
import { PrimaryButton } from "../Button";

export function SuccessStep({ email, securityPath }: { email: string; securityPath: string }) {
  const { t } = useTranslation();
  const heading = React.useRef<HTMLHeadingElement>(null);
  React.useEffect(() => heading.current?.focus(), []);

  return (
    <div data-test-id="email-change-success">
      <h1 ref={heading} tabIndex={-1} className="mb-3 text-content-accent text-3xl font-extrabold outline-none">
        {t("Email changed")}
      </h1>
      <p>
        <Trans
          i18nKey="Your account email is now <email>{{email}}</email>."
          values={{ email }}
          components={{ email: <strong className="break-all" /> }}
        />
      </p>
      <p className="mt-3 mb-6 text-content-dimmed">
        {t(
          "It’s updated across all your companies. You’re still signed in. We’ll notify your previous address about this change.",
        )}
      </p>
      <PrimaryButton linkTo={securityPath} size="sm" testId="email-change-done">
        {t("Back to Password & Security")}
      </PrimaryButton>
    </div>
  );
}
