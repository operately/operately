import React from "react";

import * as Router from "react-router-dom";

interface Props {
  to: string;
  children: React.ReactNode;
  testId?: string;
}

export function Link({ to, children, testId }: Props) {
  return (
    <Router.Link
      to={to}
      className="text-link-base hover:text-link-hover underline underline-offset-2 cursor-pointer transition-colors"
      data-test-id={testId}
    >
      {children}
    </Router.Link>
  );
}

export function DimmedLink({ to, children, testId }: Props) {
  return (
    <Router.Link
      to={to}
      className="text-content-dimmed hover:text-content-hover underline underline-offset-1 cursor-pointer transition-colors"
      data-test-id={testId}
    >
      {children}
    </Router.Link>
  );
}
