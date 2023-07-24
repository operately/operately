import React from "react";

export default function Truncate({ lines, children }) {
  return (
    <div
      style={{
        WebkitBoxOrient: "vertical",
        WebkitLineClamp: lines,
        overflow: "hidden",
        wordBreak: "break-all",
        display: "-webkit-box",
      }}
    >
      {children}
    </div>
  );
}
