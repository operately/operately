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
import { Link } from "react-router-dom";
import classnames from "classnames";
import * as Icons from "@tabler/icons-react";

type Size = "small" | "medium" | "large";

const sizes = {
  small: "max-w-2xl",
  medium: "max-w-4xl",
  large: "max-w-5xl",
};

export function Root({ size, children }: { size: Size; children: React.ReactNode }) {
  return <div className={classnames("mx-auto my-20", sizes[size])}>{children}</div>;
}

Root.defaultProps = {
  size: "medium",
};

export function Navigation({ children }) {
  return (
    <div className="bg-dark-2/30 flex items-center justify-center gap-1 py-2 mx-10 font-semibold rounded-t-lg border-x border-t border-dark-4">
      {children}
    </div>
  );
}

export function NavItem({ linkTo, children }) {
  return (
    <Link to={linkTo} className="text-sky-400 underline underline-offset-2 flex gap-1.5 items-center">
      {children}
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

export function Body({ children, minHeight = "1000px" }) {
  return (
    <div
      className="relative bg-dark-2 rounded-[20px] border border-shade-1 shadow-lg"
      style={{
        minHeight: minHeight,
        background: "linear-gradient(0deg, var(--color-dark-2) 0%, var(--color-dark-3) 100%)",
      }}
    >
      {children}
    </div>
  );
}

export function Title({ children }) {
  return (
    <div className="px-16 flex items-center gap-4 mt-12 mb-8">
      <FancyLineSeparator />
      <h1 className="text-4xl font-extrabold text-center">{children}</h1>
      <FancyLineSeparator />
    </div>
  );
}

export function FancyLineSeparator() {
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

export function LineSeparator() {
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
    <div className="px-16 flex items-center gap-4">
      <h1 className="uppercase font-bold tracking-wider">{children}</h1>
      <LineSeparator />
    </div>
  );
}
