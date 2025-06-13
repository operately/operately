import React from "react";

import * as Paper from "@/components/PaperContainer";
import * as Spaces from "@/models/spaces";

import { DeprecatedPaths } from "@/routes/paths";

export function Navigation({ space }: { space: Spaces.Space }) {
  return (
    <Paper.Navigation
      items={[
        { to: DeprecatedPaths.spacePath(space.id!), label: space.name! },
        { to: DeprecatedPaths.spaceGoalsPath(space.id!), label: "Goals & Projects" },
      ]}
    />
  );
}
