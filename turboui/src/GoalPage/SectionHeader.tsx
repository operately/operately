import React from "react";

export function SectionHeader({
  title,
  buttons,
  showButtons,
}: {
  title: string;
  buttons?: React.ReactNode;
  showButtons?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <h2 className="font-bold">{title}</h2>
      {showButtons && buttons}
    </div>
  );
}
