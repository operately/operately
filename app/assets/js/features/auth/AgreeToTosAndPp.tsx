import * as React from "react";

import { Link } from "@/components/Link";

export function TosAndPrivacyPolicy() {
  const tos = (
    <Link to="https://operately.com/legal/terms" underline="hover" target="_blank">
      Terms of Service{" "}
    </Link>
  );
  const pp = (
    <Link to="https://operately.com/legal/privacy-policy" underline="hover" target="_blank">
      Privacy Policy
    </Link>
  );

  return (
    <div className="text-center font-medium text-sm">
      By continuing, you agree to the {tos}
      and {pp}.
    </div>
  );
}
