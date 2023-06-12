import React from "react";

interface LinkButtonProps {
  title: string;
  size: "small" | "medium" | "large";
}

const textSizes = {
  small: "text-sm",
  medium: "text-base",
  large: "text-lg",
};

export default function LinkButton({ title, size }: LinkButtonProps) {
  const baseStyle = "text-brand-1 underline font-bold cursor-pointer";
  const textSize = textSizes[size];
  const className = `${baseStyle} ${textSize}`;

  return <div className={className}>{title}</div>;
}
