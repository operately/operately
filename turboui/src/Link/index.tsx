import React from "react";

import * as Router from "react-router-dom";

import classNames from "../utils/classnames";
export { GhostLink } from "./GhostLink";

interface Props {
  children: React.ReactNode;
  target?: string;
  testId?: string;
  className?: string;
  style?: React.CSSProperties;
  onMouseOver?: (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => void;
  onMouseOut?: (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => void;
  title?: string;
}

interface LinkProps extends Props {
  to: string;
  underline?: "always" | "hover" | "never";
  disableColorHoverEffect?: boolean;
}

interface ButtonLinkProps extends Props {
  onClick: () => void;
}

interface ActionLinkProps extends Props {
  onClick: () => void;
  underline?: "always" | "hover" | "never";
  disableColorHoverEffect?: boolean;
}

interface DivLinkProps extends Props {
  to: string;
  className?: string;
  style?: React.CSSProperties;
  external?: boolean;
}

const baseLinkClass = classNames("cursor-pointer", "transition-colors");

function UnstyledLink({ children, testId, ...rest }: LinkProps) {
  // Destructure and omit disableColorHoverEffect, underline, before passing to Router.Link
  // Omit disableColorHoverEffect and underline using object rest syntax
  const { disableColorHoverEffect, underline, ...linkProps } = rest;

  return (
    <Router.Link data-test-id={testId} {...linkProps}>
      {children}
    </Router.Link>
  );
}

export function Link(props: LinkProps) {
  const className = classNames(baseLinkClass, underlineClass(props.underline), "text-link-base", props.className, {
    "hover:text-link-hover": !props.disableColorHoverEffect,
  });

  return <UnstyledLink {...props} className={className} />;
}

export function BlackLink(props: LinkProps) {
  const className = classNames(baseLinkClass, underlineClass(props.underline), "text-content-base", props.className, {
    "hover:text-content-dimmed": !props.disableColorHoverEffect,
  });

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
  const className = classNames(baseLinkClass, underlineClass(props.underline), "text-link-base", props.className, {
    "hover:text-link-hover": !props.disableColorHoverEffect,
  });

  return (
    <span data-test-id={props.testId} className={className} onClick={props.onClick}>
      {props.children}
    </span>
  );
}

export function DimmedLink(props: LinkProps) {
  const className = classNames(baseLinkClass, underlineClass(props.underline), "text-content-dimmed", props.className, {
    "hover:text-content-base": !props.disableColorHoverEffect,
  });

  return <UnstyledLink {...props} className={className} />;
}

export function DivLink({ to, children, testId, target, external, style, ...props }: DivLinkProps) {
  if (external) {
    return (
      <a href={to} data-test-id={testId} {...props} target={target} style={style as any}>
        {children}
      </a>
    );
  } else {
    return (
      <Router.Link to={to} data-test-id={testId} {...props} target={target} style={style as any}>
        {children}
      </Router.Link>
    );
  }
}

function underlineClass(underline: "always" | "hover" | "never" | undefined) {
  if (!underline || underline === "always") return "underline underline-offset-2";
  if (underline === "hover") return "hover:underline underline-offset-2";
  if (underline === "never") return "";

  throw new Error("Invalid underline prop");
}
