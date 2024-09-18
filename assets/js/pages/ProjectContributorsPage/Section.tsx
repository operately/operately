import React from "react";

export function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-10">
      <SectionTitle title={title} />

      {children}
    </div>
  );
}

function SectionTitle({ title }: { title: string }) {
  return (
    <div className="flex items-center justify-between mb-2">
      <h2 className="font-bold text-lg">{title}</h2>
    </div>
  );
}
