import React from "react";
import classnames from "classnames";
import { usePaperSizeHelpers } from "./";
import { TestableElement } from "@/utils/testid";

interface BannerProps extends TestableElement {
  children: React.ReactNode;
}

export function Banner(props: BannerProps) {
  const className = classnames(
    "leading-none",
    "bg-yellow-400/10",
    "text-content-accent font-bold",
    "flex items-center justify-center",
  );

  return (
    <Header className={className} testId={props.testId}>
      {props.children}
    </Header>
  );
}

interface HeaderProps extends TestableElement {
  className: string;
  children: React.ReactNode;
}

export function Header(props: HeaderProps) {
  const { negHor, negTop, horPadding } = usePaperSizeHelpers();

  const className = classnames(
    props.className,
    "rounded-t border-b border-surface-outline mb-6 py-4",
    negHor,
    negTop,
    horPadding,
  );

  return (
    <div className={className} data-test-id={props.testId}>
      {props.children}
    </div>
  );
}
