import React from "react";

import { ProgressBar } from "@/components/charts";
import { Node } from "../tree";
import { statusColor } from "@/components/status/colors";

export function NodeProgress({ node }: { node: Node }) {
  if (node.isClosed) return <></>;

  const color = statusColor(node.lastCheckInStatus);

  return <ProgressBar color={color} percentage={node.progress} height="h-[8px]" width="w-[40px]" />;
}
