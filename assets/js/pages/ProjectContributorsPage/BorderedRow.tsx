import React from "react";

export function BorderedRow({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-2 border-t last:border-b border-stroke-dimmed">{children}</div>
  );
}
