import React from "react";
import classnames from "classnames";
import { Context } from "./Context";

export function Banner(props: { children: React.ReactNode }) {
  const { size } = React.useContext(Context);

  const negativeMargin = calcNegativeMargins(size);
  const className = classnames(
    "bg-yellow-400/10",
    "text-content-accent font-bold",
    "flex items-center justify-center",
    "rounded-t border-b border-surface-outline leading-none",
    negativeMargin,
  );

  return <div className={className}>{props.children}</div>;
}

function calcNegativeMargins(size: string) {
  switch (size) {
    case "small":
      return "-mx-10 -mt-8 mb-6 py-4";
    case "medium":
      return "-mx-12 -mt-10 mb-6 py-4";
    case "large":
      return "-mx-16 -mt-12 mb-6 py-4";
    case "xlarge":
      throw new Error("XLarge not supported");
    case "xxlarge":
      throw new Error("XXLarge not supported");
    default:
      throw new Error(`Unknown size ${size}`);
  }
}
