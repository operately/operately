import React from "react";

import { Space, SpaceTools } from "@/models/spaces";

import { GoalsAndProjects } from "./GoalsAndProjects";
import { Discussions } from "./Discussions";
import { assertPresent } from "@/utils/assertions";

interface ToolsSectionPros {
  space: Space;
  tools: SpaceTools;
}

export function ToolsSection({ space, tools }: ToolsSectionPros) {
  assertPresent(tools.goals, "goals must be present in tools");
  assertPresent(tools.projects, "projects must be present in tools");
  assertPresent(tools.messagesBoards, "messagesBoards must be present in tools");

  const toolsCount = tools.messagesBoards.length + 1;

  return (
    <div className="mt-6 py-6">
      <div className="flex justify-center items-start flex-wrap gap-8">
        <GoalsAndProjects space={space} goals={tools.goals} projects={tools.projects} toolsCount={toolsCount} />
        {tools.messagesBoards.map((boards) => (
          <Discussions space={space} discussions={boards.messages!} toolsCount={toolsCount} key={boards.id} />
        ))}
      </div>
    </div>
  );
}
