import React from "react";

export function TextSeparator({ size = 1 }: { size?: number }) {
  return <span style={{ margin: `${size * 0.25}rem` }}>&middot;</span>;
}
