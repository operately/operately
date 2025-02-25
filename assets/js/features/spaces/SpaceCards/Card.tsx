import * as React from "react";

import { DivLink } from "@/components/Link";

interface CardProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
  linkTo?: string;
  testId?: string;
}

export function Card({ children, linkTo, testId, ...props }: CardProps) {
  if (linkTo) {
    return (
      <DivLink to={linkTo} {...props} data-test-id={testId}>
        {children}
      </DivLink>
    );
  } else {
    return (
      <div {...props} data-test-id={testId}>
        {children}
      </div>
    );
  }
}
