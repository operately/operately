import React from "react";
import { DivLink } from "@/components/Link";

export function Title({ title }: { title: string }) {
  return <div className="font-bold text-lg text-center py-2 border-b border-stroke-base">{title}</div>;
}

export function Container({ children, path }: { children: NonNullable<React.ReactNode>; path: string }) {
  return (
    <DivLink to={path} className="text-sm h-[380px] w-[285px] overflow-hidden border border-stroke-base">
      {children}
    </DivLink>
  );
}
