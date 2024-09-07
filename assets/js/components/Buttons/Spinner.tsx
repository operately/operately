import React from "react";
import { PuffLoader } from "react-spinners";
import { match } from "ts-pattern";
import { BaseButtonProps } from "./UnstalyedButton";

export function Spinner({ loading, color, size }: { loading?: boolean; color: string; size: BaseButtonProps["size"] }) {
  const iconSize = match(size || "base")
    .with("xxs", () => 16)
    .with("xs", () => 18)
    .with("sm", () => 24)
    .with("base", () => 32)
    .with("lg", () => 36)
    .exhaustive();

  return (
    <div className="inset-0 flex items-center justify-center absolute">
      {loading && <PuffLoader size={iconSize} color={color} />}
    </div>
  );
}
