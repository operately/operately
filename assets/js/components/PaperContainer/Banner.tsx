import React from "react";
import classnames from "classnames";
import { Context } from "./Context";
import { Size } from "./";

export function Banner(props: { children: React.ReactNode }) {
  const className = classnames(
    "leading-none",
    "bg-yellow-400/10",
    "text-content-accent font-bold",
    "flex items-center justify-center",
  );

  return <Header className={className}>{props.children}</Header>;
}

export function Header(props: { className: string; children: React.ReactNode }) {
  const { size } = React.useContext(Context);

  const negHor = calcNegativeHorizontalMargins(size as Size);
  const negVer = calcNegativeVerticalMargins(size as Size);

  const className = classnames(props.className, "rounded-t border-b border-surface-outline", negHor, negVer);

  return <div className={className}>{props.children}</div>;
}

function calcNegativeHorizontalMargins(size: Size) {
  switch (size) {
    case "small":
      return "-mx-10";
    case "medium":
      return "-mx-12";
    case "large":
      return "-mx-16";
    case "xlarge":
      return "-mx-12";
    case "xxlarge":
      throw new Error("XXLarge not supported");
    default:
      throw new Error(`Unknown size ${size}`);
  }
}

function calcNegativeVerticalMargins(size: Size) {
  switch (size) {
    case "small":
      return "-mt-8 mb-6 py-4";
    case "medium":
      return "-mt-10 mb-6 py-4";
    case "large":
      return "-mt-12 mb-6 py-4";
    case "xlarge":
      return "-mt-12 mb-6 py-4";
    case "xxlarge":
      throw new Error("XXLarge not supported");
    default:
      throw new Error(`Unknown size ${size}`);
  }
}
