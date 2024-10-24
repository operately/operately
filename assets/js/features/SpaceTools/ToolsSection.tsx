import React from "react";

import { Discussion } from "@/models/discussions";

import { GoalsAndProjects } from "./GoalsAndProjects";
import { Discussions } from "./Discussions";

interface ToolsSectionPros {
  discussions: Discussion[];
}

export function ToolsSection({ discussions }: ToolsSectionPros) {
  return (
    <div className="mt-6 py-6">
      <div className="flex justify-center items-start flex-wrap gap-8">
        <GoalsAndProjects />
        <Discussions discussions={discussions} />
      </div>
    </div>
  );
}
