import React from "react";

import classNames from "classnames";
import { DivLink } from "@/components/Link";

export function Title({ title }: { title: string }) {
  return <div className="font-bold text-base text-center py-2">{title}</div>;
}

interface ContainerProps {
  path: string;
  children: NonNullable<React.ReactNode>;
  testId?: string;
}

export function Container({ children, path, testId }: ContainerProps) {
  const className = classNames(
    "text-xs",
    "w-full h-[380px] w-[340] max-w-[340px] overflow-hidden",
    "border border-stroke-base",
    "bg-surface-base",
    "rounded-lg shadow-sm transition-shadow duration-300 hover:shadow hover:border-surface-outline",
  );

  return (
    <DivLink to={path} className={className} testId={testId}>
      {children}
    </DivLink>
  );
}

export function ZeroResourcesContainer({ children }) {
  return <div className="text-center text-base font-semibold py-4 px-2">{children}</div>;
}
