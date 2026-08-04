import React from "react";

import * as Router from "react-router";

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

const UnstyledLink = React.forwardRef<HTMLAnchorElement, LinkProps>(function UnstyledLink(
  { children, testId, disableColorHoverEffect: _disableColorHoverEffect, underline: _underline, ...linkProps },
  ref,
) {
  return (
    <Router.Link ref={ref} data-test-id={testId} {...linkProps}>
      {children}
    </Router.Link>
  );
});

export const Link = React.forwardRef<HTMLAnchorElement, LinkProps>(function Link(props, ref) {
  const className = classNames(baseLinkClass, underlineClass(props.underline), "text-link-base", props.className, {
    "hover:text-link-hover": !props.disableColorHoverEffect,
  });

  return <UnstyledLink {...props} ref={ref} className={className} />;
});

export const BlackLink = React.forwardRef<HTMLAnchorElement, LinkProps>(function BlackLink(props, ref) {
  const className = classNames(baseLinkClass, underlineClass(props.underline), "text-content-base", props.className, {
    "hover:text-content-dimmed": !props.disableColorHoverEffect,
  });

  return <UnstyledLink {...props} ref={ref} className={className} />;
});

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
    <button type="button" data-test-id={props.testId} className={className} onClick={props.onClick}>
      {props.children}
    </button>
  );
}

export const DimmedLink = React.forwardRef<HTMLAnchorElement, LinkProps>(function DimmedLink(props, ref) {
  const className = classNames(baseLinkClass, underlineClass(props.underline), "text-content-dimmed", props.className, {
    "hover:text-content-base": !props.disableColorHoverEffect,
  });

  return <UnstyledLink {...props} ref={ref} className={className} />;
});

export const DivLink = React.forwardRef<HTMLAnchorElement, DivLinkProps>(function DivLink(
  { to, children, testId, target, external, style, ...props },
  ref,
) {
  if (external) {
    return (
      <a ref={ref} href={to} data-test-id={testId} {...props} target={target} style={style as any}>
        {children}
      </a>
    );
  } else {
    return (
      <Router.Link ref={ref} to={to} data-test-id={testId} {...props} target={target} style={style as any}>
        {children}
      </Router.Link>
    );
  }
});

function underlineClass(underline: "always" | "hover" | "never" | undefined) {
  if (!underline || underline === "always") return "underline underline-offset-2";
  if (underline === "hover") return "hover:underline underline-offset-2";
  if (underline === "never") return "";

  throw new Error("Invalid underline prop");
}
