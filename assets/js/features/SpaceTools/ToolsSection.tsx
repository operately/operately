import React from "react";

import { Discussion } from "@/models/discussions";
import { Goal } from "@/models/goals";
import { Project } from "@/models/projects";

import { GoalsAndProjects } from "./GoalsAndProjects";
import { Discussions } from "./Discussions";

interface ToolsSectionPros {
  discussions: Discussion[];
  goals: Goal[];
  projects: Project[];
}

export function ToolsSection({ discussions, goals, projects }: ToolsSectionPros) {
  return (
    <div className="mt-6 py-6">
      <div className="flex justify-center items-start flex-wrap gap-8">
        <GoalsAndProjects goals={goals} projects={projects} />
        <Discussions discussions={discussions} />
      </div>
    </div>
  );
}
