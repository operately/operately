import React from "react";

export function HorizontalLine({ className }: { className?: string }) {
  const classes = `flex-1 border-t border-surface-outline ${className}`;
  return <div className={classes}></div>;
}
