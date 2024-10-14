/**
 * This is a component that renders a paper-like container.
 * It's used in the app to render the main content of the page.
 *
 * Example usage:
 *
 * ```tsx
 * import * as Paper from "@/components/PaperContainer";
 *
 * <Paper.Root>
 *   <Paper.Navigation>
 *     <Paper.NavItem>Projects</Paper.NavItem>
 *     <Paper.NavSeparator />
 *     <Paper.NavItem>Documentation</Paper.NavItem>
 *   </Paper.Navigation>
 *
 *   <Paper.Body>
 *     <h1 className="text-2xl font-bold">Increase Revenue</h1>
 *   </Paper.Body>
 * </Paper.Root>
 * ```
 */

import React from "react";

import classNames from "classnames";

import { Context } from "./Context";
export { DimmedSection } from "./DimmedSection";
export { Banner, Header } from "./Banner";
export { Navigation, NavItem, NavSeparator, NavigateBack } from "./Navigation";
export * from "./Section";

type Size = "small" | "medium" | "large" | "xlarge" | "xxlarge";

const sizes = {
  small: "max-w-2xl",
  medium: "max-w-4xl",
  large: "max-w-screen-lg w-[90%]",
  xlarge: "max-w-6xl",
  xxlarge: "max-w-7xl",
};

interface RootProps {
  size?: Size;
  children?: React.ReactNode;
  fluid?: boolean;
  className?: string;
}

export function Root({ size, children, className, fluid = false }: RootProps): JSX.Element {
  size = size || "medium";

  className = classNames(className, "flex-1 mx-auto my-10 relative w-full max-w-screen-lg px-4 sm:px-6 lg:px-8", {
    "w-[90%]": fluid,
    [sizes[size]]: !fluid,
  });

  return (
    <Context.Provider value={{ size }}>
      <div className={className}>{children}</div>
    </Context.Provider>
  );
}

export function Body({ children, minHeight = "none", className = "", backgroundColor = "bg-surface" }) {
  return (
    <div
      className={`relative ${backgroundColor} rounded shadow-xl p-4 sm:p-8 lg:p-12 ${className} border border-surface-outline`}
      style={{
        minHeight: minHeight,
      }}
    >
      {children}
    </div>
  );
}

export function Title({ children }) {
  return (
    <div className="flex items-center gap-4 mb-8">
      <FancyLineSeparator />
      <h1 className="text-4xl font-extrabold text-center">{children}</h1>
      <FancyLineSeparator />
    </div>
  );
}

function FancyLineSeparator() {
  return (
    <div
      className="flex-1"
      style={{
        height: "2px",
        background: "linear-gradient(90deg, var(--color-pink-600) 0%, var(--color-sky-600) 100%)",
      }}
    />
  );
}

export function usePaperSizeHelpers(): { size: Size; negHor: string; negTop: string; horPadding: string } {
  const { size } = React.useContext(Context);

  let negHor = "";
  switch (size) {
    case "small":
      negHor = "-mx-10";
      break;
    case "medium":
      negHor = "-mx-12";
      break;
    case "large":
      negHor = "-mx-12";
      break;
    case "xlarge":
      negHor = "-mx-12";
      break;
    case "xxlarge":
      negHor = "-mx-16";
      break;
    default:
      throw new Error(`Unknown size ${size}`);
  }

  let negTop = "";
  switch (size) {
    case "small":
      negTop = "-mt-8";
      break;
    case "medium":
      negTop = "-mt-10";
      break;
    case "large":
      negTop = "-mt-10";
      break;
    case "xlarge":
      negTop = "-mt-10";
      break;
    case "xxlarge":
      negTop = "-mt-12";
      break;
    default:
      throw new Error(`Unknown size ${size}`);
  }

  let horPadding = "";
  switch (size) {
    case "small":
      horPadding = "px-10";
      break;
    case "medium":
      horPadding = "px-12";
      break;
    case "large":
      horPadding = "px-12";
      break;
    case "xlarge":
      horPadding = "px-12";
      break;
    case "xxlarge":
      horPadding = "px-16";
      break;
    default:
      throw new Error(`Unknown size ${size}`);
  }

  return {
    size: size,
    negHor: negHor,
    negTop: negTop,
    horPadding,
  };
}
