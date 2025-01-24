import React from "react";

import { ProgressBar } from "@/components/charts";
import { Node } from "../tree";

export function NodeProgress({ node }: { node: Node }) {
  if (node.isClosed) return <></>;

  return <ProgressBar status={node.status} percentage={node.progress} className="ml-2 h-2" width="w-10" />;
}
