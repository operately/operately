import React from "react";

import * as Paper from "@/components/PaperContainer";
import * as Spaces from "@/models/spaces";
import { Paths } from "@/routes/paths";

export function Navigation({ space }: { space: Spaces.Space }) {
  return (
    <Paper.Navigation
      items={[
        { to: Paths.spacePath(space.id!), label: space.name! },
        { to: Paths.spaceWorkMapPath(space.id!), label: "Goals & Projects" },
      ]}
    />
  );
}
