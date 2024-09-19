import React from "react";

export function PageTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-8">
      <div className="text-2xl font-extrabold mb-1">{title}</div>
      {subtitle && <div className="text-medium">{subtitle}</div>}
    </div>
  );
}
