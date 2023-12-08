import { useColorMode } from "@/theme";
import React from "react";

export function MiniPieChart({ completed, total, size = 14 }) {
  const mode = useColorMode();
  const percentage = Math.ceil((completed / total) * 100);

  let background = "";

  if (mode === "dark") {
    background = `conic-gradient(var(--color-green-500) ${percentage}%, var(--color-dark-8) ${percentage}% 100%)`;
  } else {
    background = `conic-gradient(var(--color-green-500) ${percentage}%, var(--color-zinc-200) ${percentage}% 100%)`;
  }

  return (
    <div
      style={{
        borderRadius: "50%",
        backgroundImage: background,
        height: `${size}px`,
        width: `${size}px`,
      }}
    />
  );
}
