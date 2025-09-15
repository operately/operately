import React from "react";

import type { IconProps } from "../icons";
import { IconChevronDown } from "../icons";
import { match } from "ts-pattern";
import { DivLink } from "../Link";
import { Menu } from "../Menu";
import { TestableElement } from "../TestableElement";

interface Linkable {
  linkTo?: string;
  linkTarget?: "_blank" | "_self" | "_parent" | "_top";
}

interface Clickable {
  onClick?: ((e: any) => Promise<boolean>) | ((e: any) => void);
}

interface MenuOptions {
  options?: React.ReactNode[];
  optionsAlign?: "center" | "start" | "end";
}

export interface BaseButtonProps extends MenuOptions, Linkable, Clickable, TestableElement {
  children: React.ReactNode;
  loading?: boolean;
  type?: "button" | "submit";
  size?: "xxs" | "xs" | "sm" | "base" | "lg";
  spanButton?: boolean;
  icon?: React.ComponentType<IconProps>;
  iconSize?: number;
  disabled?: boolean;
}

interface UnstyledButtonProps extends BaseButtonProps {
  className?: string;
  spinner?: React.ReactNode;
}

export function UnstyledButton(props: UnstyledButtonProps) {
  if (props.linkTo && props.onClick) {
    throw new Error("Button cannot have both linkTo and onClick props");
  }

  if (props.linkTo && props.type === "submit") {
    throw new Error("Button cannot have both linkTo and type='submit' props");
  }

  if (props.linkTarget && !props.linkTo) {
    throw new Error("Button cannot have linkTarget without linkTo prop");
  }

  if (props.linkTo) {
    return UnstyledLinkButton(props);
  } else if (props.spanButton) {
    return UnstyledSpanButton(props);
  } else if (props.options) {
    return UnstyledMenuButton(props);
  } else {
    return UnstyledActionButton(props);
  }
}

function UnstyledLinkButton(props: UnstyledButtonProps) {
  return (
    <DivLink className={props.className} to={props.linkTo!} target={props.linkTarget} testId={props.testId}>
      {props.children}
      {props.spinner}
    </DivLink>
  );
}

function UnstyledActionButton(props: UnstyledButtonProps) {
  const handleClick = (e: any) => {
    if (props.loading) return;
    if (props.onClick) props.onClick(e);
  };

  const type = props.type || "button";
  const iconSize =
    props.iconSize ||
    match(props.size || "base")
      .with("xxs", () => 12)
      .with("xs", () => 14)
      .with("sm", () => 16)
      .with("base", () => 18)
      .with("lg", () => 20)
      .exhaustive();

  let children = props.children;
  if (props.icon) {
    const c = props.children as any;
    const isSrOnly =
      !!c && typeof c === "object" && "props" in c && typeof c.props?.className === "string" && c.props.className.includes("sr-only");
    const hasVisibleLabel = !!c && !isSrOnly;

    children = hasVisibleLabel ? (
      <div className="-ml-1 flex items-center gap-1">
        <props.icon size={iconSize} />
        {props.children}
      </div>
    ) : (
      <props.icon size={iconSize} />
    );
  }

  return (
    <button type={type} className={props.className} onClick={handleClick} data-test-id={props.testId}>
      {children}
      {props.spinner}
    </button>
  );
}

function UnstyledMenuButton(props: UnstyledButtonProps) {
  if (props.options === undefined) {
    throw "Menu button must have options";
  }

  const triggerClass = props.className + " " + "inline-flex items-center gap-2";

  const trigger = (
    <div className={triggerClass} data-test-id={props.testId}>
      {props.children}
      <IconChevronDown size={16} />
    </div>
  );

  return <Menu customTrigger={trigger}>{props.options}</Menu>;
}

function UnstyledSpanButton(props: UnstyledButtonProps) {
  const handleClick = (e: any) => {
    if (props.loading) return;
    if (props.onClick) props.onClick(e);
  };

  return (
    <span className={props.className} onClick={handleClick} data-test-id={props.testId}>
      {props.children}
      {props.spinner}
    </span>
  );
}
