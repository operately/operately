import React from "react";

// We'll need to create a Menu component reference or use the one we already have
import { Menu } from "../Menu";
import { IconChevronDown } from "./icons"; // We'll create this icon

// BaseButtonProps interface in JSDoc for better typing in JS
/**
 * @typedef {Object} BaseButtonProps
 * @property {React.ReactNode} children - Button content
 * @property {boolean} [loading] - Whether the button is in loading state
 * @property {"button" | "submit"} [type] - Button type
 * @property {"xxs" | "xs" | "sm" | "base" | "lg"} [size] - Button size
 * @property {boolean} [spanButton] - Whether to render as a span instead of button
 * @property {string} [linkTo] - URL to navigate to if button is a link
 * @property {"_blank" | "_self" | "_parent" | "_top"} [linkTarget] - Target for link
 * @property {Function} [onClick] - Click handler
 * @property {React.ReactNode[]} [options] - Menu options if button has dropdown
 * @property {"center" | "start" | "end"} [optionsAlign] - Alignment of dropdown menu
 * @property {string} [testId] - Test ID for testing
 */

/**
 * @typedef {Object} UnstyledButtonProps
 * @property {string} [className] - CSS class names
 * @property {React.ReactNode} [spinner] - Spinner component for loading state
 * @extends {BaseButtonProps}
 */

/**
 * Base unstyled button component that can be a button, link, or dropdown
 * @param {UnstyledButtonProps} props 
 * @returns {JSX.Element}
 */
export function UnstyledButton(props) {
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

function UnstyledLinkButton(props) {
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

function UnstyledActionButton(props) {
  const handleClick = (e) => {
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
    >
      {props.children}
      {props.spinner}
    </button>
  );
}

function UnstyledMenuButton(props) {
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

function UnstyledSpanButton(props) {
  const handleClick = (e) => {
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
