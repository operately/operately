import React from "react";
import classnames from "classnames";

import * as Router from "react-router-dom";
import classNames from "classnames";

interface Props {
  children: React.ReactNode;
  target?: string;
  testId?: string;
  className?: string;
}

interface LinkProps extends Props {
  to: string;
  underline?: "always" | "hover" | "never";
}

interface ButtonLinkProps extends Props {
  onClick: () => void;
}

interface ActionLinkProps extends Props {
  onClick: () => void;
  underline?: "always" | "hover" | "never";
}

interface DivLinkProps extends Props {
  to: string;
  className?: string;
  style?: React.CSSProperties;
}

const baseLinkClass = classnames("cursor-pointer", "transition-colors");

function UnstyledLink(props: LinkProps) {
  return (
    <Router.Link to={props.to} className={props.className} data-test-id={props.testId} target={props.target}>
      {props.children}
    </Router.Link>
  );
}

export function Link(props: LinkProps) {
  const className = classNames(
    baseLinkClass,
    underlineClass(props.underline),
    "text-link-base hover:text-link-hover",
    props.className,
  );

  return <UnstyledLink {...props} className={className} />;
}

export function BlackLink(props: LinkProps) {
  const className = classNames(
    baseLinkClass,
    underlineClass(props.underline),
    "text-content-base hover:text-content-dimmed",
    props.className,
  );

  return <UnstyledLink {...props} className={className} />;
}

export function ButtonLink({ onClick, children, testId }: ButtonLinkProps) {
  return (
    <span onClick={onClick} className={baseLinkClass} data-test-id={testId}>
      {children}
    </span>
  );
}

export function ActionLink(props: ActionLinkProps) {
  const className = classNames(
    baseLinkClass,
    underlineClass(props.underline),
    "text-link-base hover:text-link-hover",
    props.className,
  );

  return (
    <span data-test-id={props.testId} className={className} onClick={props.onClick}>
      {props.children}
    </span>
  );
}

export function DimmedLink(props: LinkProps) {
  const className = classnames(
    baseLinkClass,
    underlineClass(props.underline),
    "text-content-dimmed hover:text-content-base",
    props.className,
  );

  return <UnstyledLink {...props} className={className} />;
}

export function DivLink({ to, children, testId, target, ...props }: DivLinkProps) {
  return (
    <Router.Link to={to} data-test-id={testId} {...props} target={target}>
      {children}
    </Router.Link>
  );
}

function underlineClass(underline: "always" | "hover" | "never" | undefined) {
  if (!underline || underline === "always") return "underline underline-offset-2";
  if (underline === "hover") return "hover:underline underline-offset-2";
  if (underline === "never") return "";

  throw new Error("Invalid underline prop");
}
