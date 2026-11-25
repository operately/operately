import React from "react";
import classNames from "../utils/classnames";

export function SectionHeader({
  title,
  buttons,
  showButtons,
  stackButtonsOnMobile = false,
}: {
  title: string;
  buttons?: React.ReactNode;
  showButtons?: boolean;
  stackButtonsOnMobile?: boolean;
}) {
  return (
    <div
      className={classNames(
        "flex gap-2",
        stackButtonsOnMobile ? "flex-col items-start sm:flex-row sm:items-center" : "items-center",
      )}
    >
      <h2 className="font-bold">{title}</h2>
      {showButtons && buttons}
    </div>
  );
}
