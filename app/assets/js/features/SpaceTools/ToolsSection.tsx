import React from "react";

import { Space, SpaceTools } from "@/models/spaces";

import { GoalsAndProjects } from "./GoalsAndProjects";
import { Discussions } from "./Discussions";
import { ResourceHub } from "./ResourceHub";
import { Tasks } from "./Tasks";

interface ToolsSectionPros {
  space: Space;
  tools: SpaceTools;
  displayTasks?: boolean;
}

export function ToolsSection({ space, tools, displayTasks }: ToolsSectionPros) {
  return (
    <div className="mt-6 py-6">
      <div className="flex justify-center items-start flex-wrap gap-4">
        <GoalsAndProjects
          title="Goals & Projects"
          space={space}
          goals={tools.goals ?? []}
          projects={tools.projects ?? []}
        />

        {(tools.messagesBoards ?? []).map((boards) => (
          <Discussions space={space} discussions={boards.messages ?? []} key={boards.id} />
        ))}

        {(tools.resourceHubs ?? []).map((hub) => (
          <ResourceHub resourceHub={hub} key={hub.id} />
        ))}

        {displayTasks && <Tasks space={space} tasks={tools.tasks ?? []} />}
      </div>
    </div>
  );
}
