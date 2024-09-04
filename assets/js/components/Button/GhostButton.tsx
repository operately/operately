import React from "react";
import { useNavigate } from "react-router-dom";
import { PuffLoader } from "react-spinners";

interface GhostButton {
  children: any;
  linkTo?: string;
  onClick?: (e: any) => void;
  testId?: string;
  size?: "xxs" | "xs" | "sm" | "base" | "lg";
  type?: "primary" | "secondary";
  loading?: boolean;
}

export function GhostButton(props: GhostButton) {
  const navigate = useNavigate();

  const handleClick = (e: any) => {
    if (props.loading) {
      return;
    }

    if (props.linkTo) {
      navigate(props.linkTo);
      return;
    }

    if (props.onClick) {
      props.onClick(e);
    }
  };

  const klass = className(props.size, props.type, props.loading);

  return (
    <div className={klass} onClick={handleClick} data-test-id={props.testId}>
      {props.children}
      <Spinner active={props.loading} />
    </div>
  );
}

function Spinner({ active }: { active?: boolean }) {
  return (
    <div className="inset-0 flex items-center justify-center absolute">
      {active && <PuffLoader size={24} color="var(--color-accent-1)" />}
    </div>
  );
}

function className(size?: "xxs" | "xs" | "sm" | "base" | "lg", type?: "primary" | "secondary", loading?: boolean) {
  size = size || "base";
  type = type || "primary";

  let result =
    "relative font-semibold hover:bg-surface-highlight transition-all duration-100 text-center flex-grow-0 flex-shrink-0";

  if (loading) {
    result += " cursor-default";
  } else {
    result += " cursor-pointer";
  }

  if (size === "xxs") {
    result += " px-2 py-[1px] text-xs rounded-2xl";
  }

  if (size === "xs") {
    result += " px-2.5 py-1 text-sm rounded-2xl";
  }

  if (size === "sm") {
    result += " px-3 py-1.5 text-sm rounded-2xl";
  }

  if (size === "base") {
    result += " px-3.5 py-2 rounded-3xl";
  }

  if (size === "lg") {
    result += " px-4 py-2.5 text-lg rounded-3xl";
  }

  if (type === "primary") {
    result += " border border-accent-1";
    if (loading) {
      result += " text-content-subtle";
    } else {
      result += " text-accent-1 hover:text-accent-1";
    }
  }

  if (type === "secondary") {
    result += " border border-surface-outline hover:border-surface-outline ";
    if (loading) {
      result += " text-content-subtle";
    } else {
      result += " text-content-base hover:text-content-accent";
    }
  }

  return result;
}
