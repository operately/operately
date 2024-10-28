import React from "react";

import { Discussion } from "@/models/discussions";
import { Goal } from "@/models/goals";
import { Project } from "@/models/projects";
import { Space } from "@/models/spaces";

import { GoalsAndProjects } from "./GoalsAndProjects";
import { Discussions } from "./Discussions";

interface ToolsSectionPros {
  space: Space;
  discussions: Discussion[];
  goals: Goal[];
  projects: Project[];
}

export function ToolsSection({ space, discussions, goals, projects }: ToolsSectionPros) {
  return (
    <div className="mt-6 py-6">
      <div className="flex justify-center items-start flex-wrap gap-8">
        <GoalsAndProjects space={space} goals={goals} projects={projects} />
        <Discussions space={space} discussions={discussions} />
      </div>
    </div>
  );
}
