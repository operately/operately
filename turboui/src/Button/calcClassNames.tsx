import classNames from "../utils/classnames";
import { BaseButtonProps } from "./UnstalyedButton";

export function calcClassName(
  props: BaseButtonProps,
  { normal, loading, always, disabled }: { normal: string; loading: string; always: string; disabled: string },
) {
  const size = props.size || "base";

  return classNames(
    "relative",
    "flex-grow-0 flex-shrink-0",
    "font-semibold text-center inline-block",
    "transition-all duration-100",
    props.className,
    always,
    {
      "cursor-default": props.loading,
      "cursor-pointer": !props.loading,
    },
    {
      "px-2 py-0.5 text-xs rounded-md": size === "xxs",
      "px-2.5 py-1 text-sm rounded-md": size === "xs",
      "px-3 py-1.5 text-sm rounded-md": size === "sm",
      "px-4 py-2 rounded-md": size === "base",
      "px-5 py-2.5 rounded-md": size === "lg",
    },
    {
      [normal]: !props.loading && !props.disabled,
      [loading]: props.loading,
    },
    {
      "cursor-not-allowed": props.disabled,
      [disabled]: props.disabled,
    },
  );
}
