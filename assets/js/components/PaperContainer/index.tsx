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
import { Link } from "@/components/Link";
import { useLoaderData, useRevalidator } from "react-router-dom";
import * as Icons from "@tabler/icons-react";

import { Context } from "./Context";
export { DimmedSection } from "./DimmedSection";
export { Banner, Header } from "./Banner";

export type Size = "small" | "medium" | "large" | "xlarge" | "xxlarge";

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
}

export function Root({ size, children, fluid = false }: RootProps): JSX.Element {
  size = size || "medium";

  const className = fluid
    ? "flex-1 mx-auto my-10 relative " + "w-[90%]"
    : "flex-1 mx-auto my-10 relative " + sizes[size];

  return (
    <Context.Provider value={{ size }}>
      <div className={className}>{children}</div>
    </Context.Provider>
  );
}

export function Navigation({ children }) {
  return (
    <div className="bg-surface-dimmed flex items-center justify-center gap-1 pt-2 pb-1 mx-10 font-semibold rounded-t border-t border-x border-surface-outline">
      {children}
    </div>
  );
}

export function NavItem({ linkTo, children }) {
  return (
    <Link to={linkTo}>
      <span className="flex items-center gap-1.5">{children}</span>
    </Link>
  );
}

export function NavSeparator() {
  return (
    <div className="shrink-0">
      <Icons.IconSlash size={16} />
    </div>
  );
}

const bodyPaddings = {
  small: "px-10 py-8",
  medium: "px-12 py-10",
  large: "px-12 py-10",
  xlarge: "px-12 py-10",
  xxlarge: "px-16 py-12",
};

export function Body({ children, minHeight, className = "", noPadding = false, backgroundColor = "bg-surface" }) {
  const { size } = React.useContext(Context);
  const padding = noPadding ? "" : bodyPaddings[size];

  return (
    <div
      className={`relative ${backgroundColor} rounded shadow-xl ${padding} ${className} border border-surface-outline`}
      style={{
        minHeight: minHeight,
      }}
    >
      {children}
    </div>
  );
}

Body.defaultProps = {
  minHeight: "none",
};

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

function LineSeparator() {
  return (
    <div
      className="flex-1"
      style={{
        height: "1px",
        background: "linear-gradient(90deg, var(--color-white-2) 0%, var(--color-white-1) 100%)",
      }}
    />
  );
}

export function SectionHeader({ children }) {
  return (
    <div className="flex items-center gap-4 mt-12 mb-4">
      <h1 className="uppercase font-bold tracking-wider">{children}</h1>
      <LineSeparator />
    </div>
  );
}

export function useLoadedData() {
  const [fetchVersion, setFetchVersion] = React.useState(0);

  const data = useLoaderData();
  const { revalidate } = useRevalidator();

  const refetch = React.useCallback(() => {
    setFetchVersion((v) => v + 1);
    revalidate();
  }, [revalidate]);

  return [data, refetch, fetchVersion];
}

export function usePaperSizeHelpers(): { size: Size; negHor: string; negTop: string; horPadding: string } {
  const { size } = React.useContext(Context);

  let negHor = "";
  switch (size) {
    case "small":
      negHor = "-mx-10 px-10";
      break;
    case "medium":
      negHor = "-mx-12 px-12";
      break;
    case "large":
      negHor = "-mx-12 px-12";
      break;
    case "xlarge":
      negHor = "-mx-12 px-12";
      break;
    case "xxlarge":
      negHor = "-mx-16 px-16";
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
