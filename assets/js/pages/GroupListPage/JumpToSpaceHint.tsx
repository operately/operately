import React from "react";

import { ComingSoonBadge } from "./ComingSoonBadge";

export function JumpToSpaceHint() {
  return (
    <div className="fixed bottom-0 w-96 left-1/2 transform -translate-x-1/2 mb-4 text-center text-content-accent rounded-xl flex items-center flex-col">
      <ComingSoonBadge />
      <div className="flex items-center justify-center gap-1 mt-1">
        Press{" "}
        <span className="border-surface-outline border bg-surface font-mono px-1 py-0.5 rounded w-6 h-6 flex items-center justify-center leading-none">
          ⌘
        </span>{" "}
        +
        <span className="border-surface-outline border bg-surface font-mono text-xs px-1 py-0.5 rounded w-6 h-6 flex items-center justify-center leading-none">
          K
        </span>{" "}
        to jump to a space.
      </div>
    </div>
  );
}
