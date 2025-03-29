import React from "react";
import classnames from "classnames";
import { TestableElement } from "@/utils/testid";

interface BannerProps extends TestableElement {
  children: React.ReactNode;
  className?: string;
}

export function Banner(props: BannerProps) {
  const className = classnames(
    "leading-none",
    "bg-yellow-400/10",
    "text-content-accent font-bold",
    "flex items-center justify-center",
    "rounded-t border-b border-surface-outline py-4",
    props.className,
  );

  return (
    <div className={className} data-test-id={props.testId}>
      {props.children}
    </div>
  );
}
