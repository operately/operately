import React from "react";
import type { BaseButtonProps } from "../../types/button";

// We'll need to create a Menu component reference or use the one we already have
import { Menu } from "../Menu";
import { IconChevronDown } from "./icons"; // We'll create this icon

/**
 * Props specific to the UnstyledButton component
 */
interface UnstyledButtonProps extends BaseButtonProps {
  /**
   * CSS class names
   */
  className?: string;
  
  /**
   * Spinner component for loading state
   */
  spinner?: React.ReactNode;
  
  /**
   * Whether to render as a span instead of button
   */
  spanButton?: boolean;
  
  /**
   * URL to navigate to if button is a link
   */
  linkTo?: string;
  
  /**
   * Target for link
   */
  linkTarget?: "_blank" | "_self" | "_parent" | "_top";
  
  /**
   * Menu options if button has dropdown
   */
  options?: React.ReactNode[];
  
  /**
   * Alignment of dropdown menu
   */
  optionsAlign?: "center" | "start" | "end";
  
  /**
   * Test ID for testing
   */
  testId?: string;
}

/**
 * Base unstyled button component that can be a button, link, or dropdown
 */
export function UnstyledButton(props: UnstyledButtonProps): React.ReactElement {
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

function UnstyledLinkButton(props: UnstyledButtonProps): React.ReactElement {
  return (
    <a 
      className={`${props.className} items-center justify-center`} 
      href={props.linkTo} 
      target={props.linkTarget} 
      data-test-id={props.testId}
    >
      {props.children}
      {props.spinner}
    </a>
  );
}

function UnstyledActionButton(props: UnstyledButtonProps): React.ReactElement {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>): void => {
    if (props.loading) return;
    if (props.onClick) props.onClick(e);
  };

  const type = props.type || "button";

  return (
    <button 
      type={type} 
      className={`${props.className} items-center justify-center`} 
      onClick={handleClick} 
      data-test-id={props.testId}
      disabled={props.disabled}
    >
      {props.children}
      {props.spinner}
    </button>
  );
}

function UnstyledMenuButton(props: UnstyledButtonProps): React.ReactElement {
  if (!props.options) {
    throw new Error("Menu button must have options");
  }

  const triggerClass = props.className;

  const trigger = (
    <div className={triggerClass} data-test-id={props.testId}>
      <div className="flex items-center gap-2">
        {props.children}
        <IconChevronDown size={16} />
      </div>
    </div>
  );

  return <Menu customTrigger={trigger}>{props.options}</Menu>;
}

function UnstyledSpanButton(props: UnstyledButtonProps): React.ReactElement {
  const handleClick = (e: React.MouseEvent<HTMLSpanElement>): void => {
    if (props.loading) return;
    if (props.onClick) props.onClick(e as unknown as React.MouseEvent<HTMLButtonElement>);
  };

  return (
    <span 
      className={props.className} 
      onClick={handleClick} 
      data-test-id={props.testId}
    >
      {props.children}
      {props.spinner}
    </span>
  );
}
