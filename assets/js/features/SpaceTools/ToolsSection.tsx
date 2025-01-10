import React from "react";

import { Space, SpaceTools } from "@/models/spaces";

import { GoalsAndProjects } from "./GoalsAndProjects";
import { Discussions } from "./Discussions";
import { assertPresent } from "@/utils/assertions";
import { ResourceHub } from "./ResourceHub";

interface ToolsSectionPros {
  space: Space;
  tools: SpaceTools;
  hasResourceHubsFeature: boolean;
}

export function ToolsSection({ space, tools, hasResourceHubsFeature }: ToolsSectionPros) {
  assertPresent(tools.goals, "goals must be present in tools");
  assertPresent(tools.projects, "projects must be present in tools");
  assertPresent(tools.messagesBoards, "messagesBoards must be present in tools");
  assertPresent(tools.resourceHubs, "resourceHubs must be present in tools");

  let toolsCount = 1 + tools.messagesBoards.length;

  if (hasResourceHubsFeature) {
    toolsCount += tools.resourceHubs.length;
  }

  return (
    <div className="mt-6 py-6">
      <div className="flex justify-center items-start flex-wrap gap-4">
        <GoalsAndProjects title="Goals & Projects" space={space} goals={tools.goals} projects={tools.projects} />

        {tools.messagesBoards.map((boards) => (
          <Discussions space={space} discussions={boards.messages!} key={boards.id} />
        ))}

        {hasResourceHubsFeature &&
          tools.resourceHubs.map((hub) => <ResourceHub space={space} resourceHub={hub} key={hub.id} />)}
      </div>
    </div>
  );
}
