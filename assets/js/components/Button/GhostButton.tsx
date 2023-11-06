import React from "react";
import { useNavigate } from "react-router-dom";

interface GhostButton {
  children: any;
  linkTo?: string;
  onClick?: (e: any) => void;
  testId?: string;
  size?: "base" | "lg";
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
    <div className={className(props.size)} onClick={handleClick} data-test-id={props.testId}>
      {props.children}
    </div>
  );
}

function className(size?: "base" | "lg") {
  size = size || "base";

  if (size === "base") {
    return "px-4 py-1 rounded-3xl border border-green-400 text-green-400 hover:bg-green-400/10 transition-all duration-100 cursor-pointer";
  }

  if (size === "lg") {
    return "px-6 py-2 text-lg rounded-3xl border border-green-400 text-green-400 hover:bg-green-400/10 transition-all duration-100 cursor-pointer";
  }

  throw new Error(`Unknown size: ${size}`);
}
