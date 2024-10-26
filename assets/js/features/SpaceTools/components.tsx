import React from "react";

export function Title({ title }: { title: string }) {
  return <div className="font-bold text-lg text-center py-2 border-b border-stroke-base">{title}</div>;
}

export function Container({ children }) {
  return <div className="min-h-[160px] w-[300px] border border-stroke-base">{children}</div>;
}
