import React from "react";

export function SpaceCardGrid({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap gap-4 justify-center">{children}</div>;
}
