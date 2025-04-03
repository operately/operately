import React from "react";

import * as Spaces from "@/models/spaces";
import * as Paper from "@/components/PaperContainer";

import { Paths } from "@/routes/paths";

export function SpacePageNavigation({ space }: { space: Spaces.Space }) {
  return <Paper.Navigation items={[{ to: Paths.spacePath(space.id!), label: space.name! }]} />;
}
