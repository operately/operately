import * as React from "react";

import { Link } from "react-router-dom";

interface CardProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
  linkTo?: string;
  testId?: string;
}

export function Card({ children, linkTo, testId, ...props }: CardProps) {
  if (linkTo) {
    return (
      <Link to={linkTo} {...props} data-test-id={testId}>
        {children}
      </Link>
    );
  } else {
    return <div {...props}>{children}</div>;
  }
}
