import React from "react";

import { useWindowSizeBreakpoints } from "@/components/Pages";

import { match } from "ts-pattern";
import { ProgressBar } from "@/components/charts";
import { Node } from "../tree";

export function NodeProgress({ node }: { node: Node }) {
  if (node.isClosed) return <></>;

  const size = useWindowSizeBreakpoints();
  const width = match(size)
    .with("xs", () => "w-16")
    .with("sm", () => "w-16")
    .otherwise(() => undefined);

  return <ProgressBar percentage={node.progress} className="ml-2 h-2" width={width} />;
}
