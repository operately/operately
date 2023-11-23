import React from "react";
import { useNavigate } from "react-router-dom";

interface GhostButton {
  children: any;
  linkTo?: string;
  onClick?: (e: any) => void;
  testId?: string;
  size?: "xxs" | "xs" | "sm" | "base" | "lg";
  type?: "primary" | "secondary";
}

export function GhostButton(props: GhostButton) {
  const navigate = useNavigate();

  const handleClick = (e: any) => {
    if (props.linkTo) {
      navigate(props.linkTo);
      return;
    }

    if (props.onClick) {
      props.onClick(e);
    }
  };

  return (
    <div className={className(props.size, props.type)} onClick={handleClick} data-test-id={props.testId}>
      {props.children}
    </div>
  );
}

function className(size?: "xxs" | "xs" | "sm" | "base" | "lg", type?: "primary" | "secondary") {
  size = size || "base";
  type = type || "primary";

  let result = "font-medium transition-all duration-100 cursor-pointer text-center";

  if (size === "xxs") {
    result += " px-2 py-[1px] text-sm rounded-2xl";
  }

  if (size === "xs") {
    result += " px-2.5 py-0.5 text-sm rounded-2xl";
  }

  if (size === "sm") {
    result += " px-3 py-1 text-sm rounded-2xl";
  }

  if (size === "base") {
    result += " px-4 py-1 rounded-3xl";
  }

  if (size === "lg") {
    result += " px-6 py-2 text-lg rounded-3xl";
  }

  if (type === "primary") {
    result += " border-2 border-accent-1 text-accent-1 hover:text-accent-1";
  }

  if (type === "secondary") {
    result +=
      " border border-surface-outline hover:border-surface-outline text-content-dimmed hover:text-content-accent";
  }

  return result;
}
