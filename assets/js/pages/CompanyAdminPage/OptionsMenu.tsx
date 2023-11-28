import { createTestId } from "@/utils/testid";
import * as React from "react";
import { Link } from "react-router-dom";

export function OptionsMenu({ children }) {
  return (
    <div className="bg-surface-dimmed rounded-lg overflow-hidden divide-y divide-surface-outline border border-surface-outline">
      {children}
    </div>
  );
}

export function OptionsMenuItem({ icon, title, linkTo }) {
  const testId = createTestId(title);

  return (
    <Link
      to={linkTo}
      className="flex items-center gap-4 group cursor-pointer px-4 py-3 font-bold text-lg"
      data-test-id={testId}
    >
      {React.createElement(icon, { size: 24 })}
      {title}
    </Link>
  );
}
