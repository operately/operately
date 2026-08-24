import React from "react";

import classNames from "classnames";

interface Props {
  children: React.ReactNode;
  onClick: () => void;
  active?: boolean;
  title?: string;
}

export function DevPill({ children, onClick, active, title }: Props) {
  const className = classNames(
    "inline-flex items-center gap-1 rounded px-1.5 py-1",
    "border text-xxs uppercase tracking-wide leading-none transition-colors",
    active
      ? "border-[rgba(52,211,153,0.4)] bg-[rgba(52,211,153,0.14)] text-emerald-300"
      : "border-shade-2 bg-shade-1 text-white-2 hover:bg-shade-2 hover:text-white-1",
  );

  return (
    <button type="button" className={className} onClick={onClick} title={title}>
      {children}
    </button>
  );
}

export function DevIconButton({ children, onClick, title }: Omit<Props, "active">) {
  const className = classNames(
    "inline-flex items-center justify-center rounded p-1",
    "text-white-2 transition-colors hover:bg-shade-2 hover:text-white-1",
  );

  return (
    <button type="button" className={className} onClick={onClick} title={title}>
      {children}
    </button>
  );
}
