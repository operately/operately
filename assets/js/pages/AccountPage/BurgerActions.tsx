import React from "react";
import classNames from "classnames";

import { DivLink } from "@/components/Link";

export function BurgerActionsGroup({ children }: { children: React.ReactNode }) {
  return <div className={GroupStyle}>{children}</div>;
}

interface BurgerLinkProps {
  icon: any;
  children: React.ReactNode;
  to: string;
  testId: string;
}

export function BurgerLink(props: BurgerLinkProps) {
  return (
    <DivLink to={props.to} className={ItemStyle} testId={props.testId}>
      {React.createElement(props.icon, { size: 24 })} {props.children}
    </DivLink>
  );
}

interface BurgerButtonProps {
  icon: any;
  children: React.ReactNode;
  onClick: () => void;
  testId: string;
}

export function BurgerButton(props: BurgerButtonProps) {
  return (
    <div onClick={props.onClick} className={ItemStyle} data-test-id={props.testId}>
      {React.createElement(props.icon, { size: 24 })} {props.children}
    </div>
  );
}

const GroupStyle = classNames(
  "bg-surface-dimmed",
  "rounded-lg",
  "overflow-hidden",
  "divide-y divide-surface-outline",
  "border border-surface-outline",
);

const ItemStyle = classNames(
  "flex items-center gap-4",
  "hover:bg-surface-accent",
  "cursor-pointer",
  "px-4 py-3",
  "font-bold text-lg",
);
