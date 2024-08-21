import * as React from "react";

export function Section({ children }: { children: React.ReactNode }) {
  return <div className="-mx-12 px-12 py-12 border-t border-surface-outline">{children}</div>;
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return <div className="text-content-accent text-2xl font-bold">{children}</div>;
}
