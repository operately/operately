import React from "react";

import { UnstyledButton } from "./UnstyledButton";
import { Spinner } from "./Spinner";
import { calcClassName } from "./calcClassNames";

/**
 * Primary Button component - solid accent color background
 * @param {import('./UnstyledButton').BaseButtonProps} props
 * @returns {JSX.Element}
 */
export function PrimaryButton(props) {
  const className = calcClassName(props, {
    always: "border border-accent-1",
    normal: "text-white-1 bg-accent-1 hover:bg-accent-1-light",
    loading: "text-content-subtle bg-accent-1-light",
  });

  return (
    <UnstyledButton
      {...props}
      className={className}
      spinner={<Spinner loading={props.loading} size={props.size || "base"} color="var(--color-white-1)" />}
    />
  );
}

/**
 * Ghost Button component - transparent with accent border and text
 * @param {import('./UnstyledButton').BaseButtonProps} props
 * @returns {JSX.Element}
 */
export function GhostButton(props) {
  const className = calcClassName(props, {
    always: "border border-accent-1",
    loading: "text-content-subtle bg-accent-1-light",
    normal: "text-accent-1 hover:text-white-1 hover:bg-accent-1",
  });

  return (
    <UnstyledButton
      {...props}
      className={className}
      spinner={<Spinner loading={props.loading} color="var(--color-white-1)" size={props.size || "base"} />}
    />
  );
}

/**
 * Secondary Button component - subtle with border
 * @param {import('./UnstyledButton').BaseButtonProps} props
 * @returns {JSX.Element}
 */
export function SecondaryButton(props) {
  const className = calcClassName(props, {
    always: "border border-surface-outline bg-surface-base",
    normal: "text-content-dimmed hover:text-content-base hover:bg-surface-accent",
    loading: "text-content-subtle",
  });

  return (
    <UnstyledButton
      {...props}
      className={className}
      spinner={<Spinner loading={props.loading} size={props.size || "base"} color="var(--color-accent-1)" />}
    />
  );
}

/**
 * Danger Button component - red accent for destructive actions
 * @param {import('./UnstyledButton').BaseButtonProps} props
 * @returns {JSX.Element}
 */
export function DangerButton(props) {
  const className = calcClassName(props, {
    always: "border border-danger",
    normal: "text-white-1 bg-danger hover:bg-danger-light",
    loading: "text-content-subtle bg-danger-light",
  });

  return (
    <UnstyledButton
      {...props}
      className={className}
      spinner={<Spinner loading={props.loading} size={props.size || "base"} color="var(--color-white-1)" />}
    />
  );
}

/**
 * Text Button component - no border or background, just text
 * @param {import('./UnstyledButton').BaseButtonProps} props
 * @returns {JSX.Element}
 */
export function TextButton(props) {
  const className = calcClassName(props, {
    always: "",
    normal: "text-accent-1 hover:text-accent-1-light",
    loading: "text-content-subtle",
  });

  return (
    <UnstyledButton
      {...props}
      className={className}
      spinner={<Spinner loading={props.loading} size={props.size || "base"} color="var(--color-accent-1)" />}
    />
  );
}

/**
 * Danger Ghost Button component - transparent with danger border and text
 * @param {import('./UnstyledButton').BaseButtonProps} props
 * @returns {JSX.Element}
 */
export function DangerGhostButton(props) {
  const className = calcClassName(props, {
    always: "border border-danger",
    loading: "text-content-subtle bg-danger-light",
    normal: "text-danger hover:text-white-1 hover:bg-danger",
  });

  return (
    <UnstyledButton
      {...props}
      className={className}
      spinner={<Spinner loading={props.loading} color="var(--color-white-1)" size={props.size || "base"} />}
    />
  );
}
