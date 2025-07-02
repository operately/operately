export type { BaseButtonProps } from "./UnstalyedButton";

import React from "react";
import { Spinner } from "./Spinner";
import { BaseButtonProps, UnstyledButton } from "./UnstalyedButton";
import { calcClassName } from "./calcClassNames";

export function PrimaryButton(props: BaseButtonProps) {
  const className = calcClassName(props, {
    always: "border border-brand-1",
    normal: "text-white-1 bg-brand-1 hover:bg-blue-600",
    loading: "text-content-subtle bg-blue-400 border-blue-400",
    disabled: "text-white-1 bg-blue-500 border-blue-500 opacity-50",
  });

  return (
    <UnstyledButton
      {...props}
      className={className}
      spinner={<Spinner loading={props.loading} size={props.size} color="var(--color-white-1)" />}
    />
  );
}

export function DangerButton(props: BaseButtonProps) {
  const className = calcClassName(props, {
    always: "border border-red-500",
    normal: "text-white-1 bg-red-500 hover:bg-red-600 dark:hover:bg-red-400",
    loading: "text-content-subtle bg-red-400 border-red-400 dark:bg-red-500 dark:border-red-500",
    disabled: "text-content-subtle bg-red-400 border-red-400 dark:bg-red-500 dark:border-red-500",
  });

  return (
    <UnstyledButton
      {...props}
      className={className}
      spinner={<Spinner loading={props.loading} size={props.size} color="var(--color-white-1)" />}
    />
  );
}

export function GhostButton(props: BaseButtonProps) {
  const className = calcClassName(props, {
    always: "border border-brand-1",
    normal: "text-brand-1 hover:text-white-1 hover:bg-brand-1",
    loading: "text-content-subtle bg-brand-2 border-brand-2",
    disabled: "text-content-subtle border-blue-300",
  });

  return (
    <UnstyledButton
      {...props}
      className={className}
      spinner={<Spinner loading={props.loading} color="#3185FF" size={props.size} />}
    />
  );
}

export function SecondaryButton(props: BaseButtonProps) {
  const className = calcClassName(props, {
    always: "border border-surface-outline bg-surface-base",
    normal: "text-content-dimmed hover:text-content-base hover:bg-surface-accent",
    loading: "text-content-subtle bg-surface-accent border-surface-accent",
    disabled: "text-content-subtle bg-surface-accent border-surface-accent",
  });

  return (
    <UnstyledButton
      {...props}
      className={className}
      spinner={<Spinner loading={props.loading} size={props.size} color="var(--color-accent-1)" />}
    />
  );
}
