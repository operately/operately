import React from "react";

import { ProgressBar } from "@/components/charts";
import { Node } from "../tree";

export function NodeProgress({ node }: { node: Node }) {
  if (node.isClosed) return <></>;

  const width = "w-20";

  return <ProgressBar percentage={node.progress} className="" width={width} />;
}
