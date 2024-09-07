import React from "react";

import { BaseButtonProps, UnstyledButton } from "./UnstalyedButton";

import classNames from "classnames";
import { Spinner } from "./Spinner";

export function PrimaryButton(props: BaseButtonProps) {
  const className = classNames(
    ...baseClasses,
    "border border-accent-1",
    "bg-accent-1 hover:bg-accent-1-light",
    {
      "text-content-subtle": props.loading,
      "text-white-1": !props.loading,
    },
    cursorClasses(props.loading),
    sizeClasses(props.size),
  );

  return <UnstyledButton {...props} className={className} spinner={<Spinner active={props.loading} />} />;
}

export function SecondaryButton(props: BaseButtonProps) {
  const className = classNames(
    ...baseClasses,
    "border border-surface-outline",
    "hover:bg-surface-accent",
    {
      "cursor-default text-content-subtle": props.loading,
      "cursor-pointer text-content-dimmed hover:text-content-base": !props.loading,
    },
    cursorClasses(props.loading),
    sizeClasses(props.size),
  );

  return <UnstyledButton {...props} className={className} spinner={<Spinner active={props.loading} />} />;
}

export function GhostButton(props: BaseButtonProps) {
  const className = classNames(
    ...baseClasses,
    "border border-accent-1",
    "hover:bg-accent-1",
    "hover:text-surface",
    {
      "text-content-subtle": props.loading,
      "text-accent-1 hover:text-content-accent": !props.loading,
    },
    cursorClasses(props.loading),
    sizeClasses(props.size),
  );

  return <UnstyledButton {...props} className={className} spinner={<Spinner active={props.loading} />} />;
}

const baseClasses = [
  "relative",
  "flex-grow-0 flex-shrink-0",
  "font-semibold text-center inline-block",
  "transition-all duration-100",
];

function cursorClasses(loading?: BaseButtonProps["loading"]) {
  return {
    "cursor-default": loading,
    "cursor-pointer": !loading,
  };
}

function sizeClasses(size?: BaseButtonProps["size"]) {
  size = size || "base";

  return {
    "px-2 py-[1px] text-xs rounded-2xl": size === "xxs",
    "px-2.5 py-1 text-sm rounded-full": size === "xs",
    "px-3 py-1.5 text-sm rounded-full": size === "sm",
    "px-3.5 py-2 rounded-full": size === "base",
    "px-4 py-2.5 rounded-full": size === "lg",
  };
}
