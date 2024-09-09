import React from "react";

import { DivLink } from "@/components/Link";
import { TestableElement } from "@/utils/testid";

interface Linkable {
  linkTo?: string;
  linkTarget?: "_blank" | "_self" | "_parent" | "_top";
}

interface Clickable {
  onClick?: ((e: any) => Promise<boolean>) | ((e: any) => void);
}

export interface BaseButtonProps extends Linkable, Clickable, TestableElement {
  children: React.ReactNode;
  loading?: boolean;
  type?: "button" | "submit";
  size?: "xxs" | "xs" | "sm" | "base" | "lg";
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

  return (
    <button type={type} className={props.className} onClick={handleClick} data-test-id={props.testId}>
      {props.children}
      {props.spinner}
    </button>
  );
}
