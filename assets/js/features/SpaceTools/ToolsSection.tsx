import React from "react";

import { Space } from "@/models/spaces";
import { Discussion } from "@/models/discussions";

import { GoalsAndProjects } from "./GoalsAndProjects";
import { Discussions } from "./Discussions";

interface ToolsSectionPros {
  space: Space;
  discussions: Discussion[];
}

export function ToolsSection({ space, discussions }: ToolsSectionPros) {
  return (
    <div className="mt-6 py-6">
      <div className="flex justify-center items-start flex-wrap gap-8">
        <GoalsAndProjects space={space} />
        <Discussions discussions={discussions} />
      </div>
    </div>
  );
}
