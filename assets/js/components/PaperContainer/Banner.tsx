import React from "react";
import classnames from "classnames";
import { usePaperSizeHelpers } from "./";

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
  const { negHor, negTop } = usePaperSizeHelpers();

  const className = classnames(props.className, "rounded-t border-b border-surface-outline mb-6 py-4", negHor, negTop);

  return <div className={className}>{props.children}</div>;
}
