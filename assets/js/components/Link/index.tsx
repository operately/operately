import React from "react";
import classnames from "classnames";

import * as Router from "react-router-dom";

interface Props {
  children: React.ReactNode;
  target?: string;
  testId?: string;
}

interface LinkProps extends Props {
  to: string;
  underline?: boolean;
}

interface ButtonLinkProps extends Props {
  onClick: () => void;
}

interface DivLinkProps extends Props {
  to: string;
  className?: string;
  onDragStart?: (event: React.DragEvent<HTMLDivElement>) => void;
}

const baseClassNoUnderline = classnames(
  "text-link-base hover:text-link-hover",
  "hover:underline underline-offset-2",
  "cursor-pointer",
  "transition-colors",
);

const baseClassName = classnames(
  "text-link-base hover:text-link-hover",
  "underline underline-offset-2",
  "cursor-pointer",
  "transition-colors",
);

const dimmedClassName = classnames(
  "text-content-dimmed hover:text-content-hover",
  "underline underline-offset-2",
  "cursor-pointer",
  "transition-colors",
);

export function Link({ to, children, target, underline = true, testId }: LinkProps) {
  const className = underline ? baseClassName : baseClassNoUnderline;

  return (
    <Router.Link to={to} className={className} data-test-id={testId} target={target}>
      {children}
    </Router.Link>
  );
}

export function ButtonLink({ onClick, children, testId }: ButtonLinkProps) {
  return (
    <span onClick={onClick} className={baseClassName} data-test-id={testId}>
      {children}
    </span>
  );
}

export function DimmedLink({ to, children, target, testId }: LinkProps) {
  return (
    <Router.Link to={to} className={dimmedClassName} data-test-id={testId} target={target}>
      {children}
    </Router.Link>
  );
}

export function DivLink({ to, children, testId, target, ...props }: DivLinkProps) {
  return (
    <Router.Link to={to} data-test-id={testId} {...props} target={target}>
      {children}
    </Router.Link>
  );
}
