import classNames from "classnames";
import type { BaseButtonProps, ButtonThemeOptions } from "../../types/button";

/**
 * Calculate class names for button based on props and theme options
 * @param props - Button props
 * @param options - Theme options
 * @returns Calculated class names
 */
export function calcClassName(
  props: BaseButtonProps, 
  { normal, loading, always }: ButtonThemeOptions
): string {
  const size = props.size || "base";

  return classNames(
    "relative",
    "flex-grow-0 flex-shrink-0",
    "font-semibold text-center inline-flex items-center justify-center",
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
      [normal]: !props.loading,
      [loading]: props.loading,
    },
  );
}
