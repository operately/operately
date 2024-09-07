import classNames from "classnames";

import { BaseButtonProps } from "./UnstalyedButton";

export function calcClassName(props: BaseButtonProps, { normal, loading, always }): any {
  const size = props.size || "base";

  return classNames(
    "relative",
    "flex-grow-0 flex-shrink-0",
    "font-semibold text-center inline-block",
    "transition-all duration-100",
    always,
    {
      "cursor-default": loading,
      "cursor-pointer": !loading,
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
