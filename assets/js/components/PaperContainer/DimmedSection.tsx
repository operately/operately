import React from "react";
import classnames from "classnames";
import { Context } from "./Context";

export function DimmedSection(props: { children: React.ReactNode }) {
  const { size } = React.useContext(Context);

  const negativeMargin = calcNegativeMargins(size);
  const className = classnames("mt-6 border-t border-surface-outline bg-surface-dimmed rounded-b", negativeMargin);

  return <div className={className}>{props.children}</div>;
}

function calcNegativeMargins(size: string) {
  switch (size) {
    case "small":
      return "-mx-10 px-10 -my-8 py-8";
    case "medium":
      return "-mx-12 px-12 -my-10 py-10";
    case "large":
      return "-mx-16 px-16 -my-12 py-12";
    case "xlarge":
      throw new Error("XLarge not supported");
    case "xxlarge":
      throw new Error("XXLarge not supported");
    default:
      throw new Error(`Unknown size ${size}`);
  }
}
