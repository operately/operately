import * as React from "react";

import { Link } from "react-router-dom";

interface CardProps extends React.ComponentPropsWithoutRef<"div"> {
  children: React.ReactNode;
  linkTo?: string;
  testId?: string;
}

export function Card({ children, linkTo, ...props }: CardProps) {
  const cardProps = {
    ...props,
    "data-test-id": props.testId,
  };

  if (linkTo) {
    return (
      <Link to={linkTo} {...cardProps}>
        {children}
      </Link>
    );
  } else {
    return <div {...cardProps}>{children}</div>;
  }
}
