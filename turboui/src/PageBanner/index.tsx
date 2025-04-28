import React from "react";
import classnames from "../utils/classnames";

interface Props {
  children: React.ReactNode;
  className?: string;
}

export function PageBanner(props: Props) {
  const className = classnames(
    "leading-none",
    "bg-yellow-400/10",
    "text-content-accent font-bold",
    "dark:text-yellow-400",
    "flex items-center justify-center",
    "rounded-t border-b border-surface-outline py-4",
    props.className,
  );

  return <div className={className}>{props.children}</div>;
}
