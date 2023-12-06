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
import classnames from "classnames";
import * as Icons from "@tabler/icons-react";

import { Context } from "./Context";
export { DimmedSection } from "./DimmedSection";

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
}

export function Root({ size, children }: RootProps): JSX.Element {
  size = size || "medium";

  return (
    <Context.Provider value={{ size }}>
      <div className="fixed top-0 left-0 right-0 bottom-0 overflow-y-auto">
        <div className={classnames("flex-1 mx-auto my-16 relative", sizes[size])}>{children}</div>
      </div>
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
  large: "px-16 py-12",
  xlarge: "px-16 py-12",
  xxlarge: "px-16 py-12",
};

export function Body({ children, minHeight, className = "", noPadding = false }) {
  const { size } = React.useContext(Context);
  const padding = noPadding ? "" : bodyPaddings[size];

  return (
    <div
      className={`relative bg-surface rounded shadow-xl ${padding} ${className} border border-surface-outline`}
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
