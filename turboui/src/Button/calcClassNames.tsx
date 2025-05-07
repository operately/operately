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
    always,
    {
      "cursor-default": props.loading,
      "cursor-pointer": !props.loading,
    },
    {
      "px-2 py-[1px] text-xs rounded-2xl": size === "xxs",
      "px-2.5 py-1 text-sm rounded-full": size === "xs",
      "px-3 py-1.5 text-sm rounded-full": size === "sm",
      "px-3.5 py-2 rounded-full": size === "base",
      "px-4 py-2.5 rounded-full": size === "lg",
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
