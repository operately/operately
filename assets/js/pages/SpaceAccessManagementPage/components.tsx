import React, { ReactNode } from "react";


export function MemberContainer({children}: { children: NonNullable<ReactNode> }) {
  return (
    <div className="grid grid-cols-[1fr_30%_20px] items-center gap-2 w-full">
      {children}
    </div>
  );
}
