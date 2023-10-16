import React from "react";

export function TextSeparator({ size = 1 }: { size?: number }) {
  return (
    <span className="leading-none" style={{ margin: `0 ${size * 0.25}rem` }}>
      &middot;
    </span>
  );
}
