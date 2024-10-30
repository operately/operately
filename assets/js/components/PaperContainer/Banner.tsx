import React from "react";
import classnames from "classnames";
import { usePaperSizeHelpers } from "./";
import { TestableElement } from "@/utils/testid";

interface BannerProps extends TestableElement {
  children: React.ReactNode;
  className?: string;
}

export function Banner(props: BannerProps) {
  const { negHor, negTop, horPadding } = usePaperSizeHelpers();

  const className = classnames(
    "leading-none",
    "bg-yellow-400/10",
    "text-content-accent font-bold",
    "flex items-center justify-center",
    "rounded-t border-b border-surface-outline mb-6 py-4",
    negHor,
    negTop,
    horPadding,
    props.className,
  );

  return (
    <div className={className} data-test-id={props.testId}>
      {props.children}
    </div>
  );
}
