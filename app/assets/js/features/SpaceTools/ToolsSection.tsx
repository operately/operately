import React from "react";

import { Space, SpaceTools } from "@/models/spaces";
import * as Companies from "@/models/companies";
import { useCompanyLoaderData } from "@/routes/useCompanyLoaderData";

import { GoalsAndProjects } from "./GoalsAndProjects";
import { Discussions } from "./Discussions";
import { ResourceHub } from "./ResourceHub";
import { Tasks } from "./Tasks";
import { Kpis } from "./Kpis";

interface ToolsSectionPros {
  space: Space;
  tools: SpaceTools;
}

export function ToolsSection({ space, tools }: ToolsSectionPros) {
  const { company } = useCompanyLoaderData();
  const kpisEnabled = Companies.hasFeature(company, "space_kpis");
  return (
    <div className="mt-6 py-6">
      <div className="flex justify-center items-start flex-wrap gap-4">
        <GoalsAndProjects
          title="Goals & Projects"
          space={space}
          goals={tools.goals ?? []}
          projects={tools.projects ?? []}
        />

        {tools.discussionsEnabled &&
          (tools.messagesBoards ?? []).map((boards) => (
            <Discussions space={space} discussions={boards.messages ?? []} key={boards.id} />
          ))}

        {tools.resourceHubEnabled &&
          (tools.resourceHubs ?? []).map((hub) => <ResourceHub resourceHub={hub} key={hub.id} />)}

        {tools.tasksEnabled && <Tasks space={space} tasks={tools.tasks ?? []} />}

        {kpisEnabled && <Kpis space={space} />}
      </div>
    </div>
  );
}
