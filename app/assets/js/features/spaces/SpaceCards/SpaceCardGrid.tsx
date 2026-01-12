import React from "react";

export function SpaceCardGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid md:grid-cols-3 grid-cols-2 gap-4">{children}</div>;
}
