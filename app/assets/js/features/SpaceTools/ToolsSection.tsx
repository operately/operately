import React from "react";

import { Space, SpaceTools } from "@/models/spaces";

import { GoalsAndProjects } from "./GoalsAndProjects";
import { Discussions } from "./Discussions";
import { ResourceHub } from "./ResourceHub";
import { Tasks } from "./Tasks";

interface ToolsSectionPros {
  space: Space;
  tools: SpaceTools;
}

export function ToolsSection({ space, tools }: ToolsSectionPros) {
  return (
    <div className="mt-6 py-6">
      <div className="flex justify-center items-start flex-wrap gap-4">
        <GoalsAndProjects
          title="Goals & Projects"
          space={space}
          goals={tools.goals ?? []}
          projects={tools.projects ?? []}
        />

        {tools.discussionsEnabled && (tools.messagesBoards ?? []).map((boards) => (
          <Discussions space={space} discussions={boards.messages ?? []} key={boards.id} />
        ))}

        {tools.resourceHubEnabled && (tools.resourceHubs ?? []).map((hub) => (
          <ResourceHub resourceHub={hub} key={hub.id} />
        ))}

        {tools.tasksEnabled && <Tasks space={space} tasks={tools.tasks ?? []} />}
      </div>
    </div>
  );
}
