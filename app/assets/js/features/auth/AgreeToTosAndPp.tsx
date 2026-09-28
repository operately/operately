import * as React from "react";
import { Trans } from "react-i18next";

import { Link } from "turboui";

export function TosAndPrivacyPolicy() {
  return (
    <div className="text-center font-medium text-sm">
      <Trans
        i18nKey="By continuing, you agree to the <tos>Terms of Service</tos> and <pp>Privacy Policy</pp>."
        components={{
          tos: <Link to="https://operately.com/legal/terms" underline="hover" target="_blank" />,
          pp: <Link to="https://operately.com/legal/privacy-policy" underline="hover" target="_blank" />,
        }}
      />
    </div>
  );
}
