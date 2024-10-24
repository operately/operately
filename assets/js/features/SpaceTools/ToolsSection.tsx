import React from "react";

import * as Paper from "@/components/PaperContainer";
import { Space } from "@/models/spaces";

import { GoalsAndProjects } from "./GoalsAndProjects";
import { Discussions } from "./Discussions";

export function ToolsSection({ space }: { space: Space }) {
  return (
    <Paper.DimmedSection>
      <div className="flex justify-center items-start flex-wrap gap-8">
        <GoalsAndProjects space={space} />
        <Discussions space={space} />
      </div>
    </Paper.DimmedSection>
  );
}
