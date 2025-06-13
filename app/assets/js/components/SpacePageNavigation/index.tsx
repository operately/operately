import React from "react";

import * as Paper from "@/components/PaperContainer";
import * as Spaces from "@/models/spaces";

import { usePaths } from "@/routes/paths";
export function SpacePageNavigation({ space }: { space: Spaces.Space }) {
  const paths = usePaths();
  return <Paper.Navigation items={[{ to: paths.spacePath(space.id!), label: space.name! }]} />;
}
