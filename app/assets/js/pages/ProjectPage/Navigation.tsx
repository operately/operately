import React from "react";

import * as Paper from "@/components/PaperContainer";
import * as Spaces from "@/models/spaces";

export function Navigation({ space }: { space: Spaces.Space }) {
  return (
    <Paper.Navigation
      items={[
        { to: paths.spacePath(space.id!), label: space.name! },
        { to: paths.spaceGoalsPath(space.id!), label: "Goals & Projects" },
      ]}
    />
  );
}
