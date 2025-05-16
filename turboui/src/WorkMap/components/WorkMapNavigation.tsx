import { IconChecklist, IconCircleCheck, IconLayoutGrid, IconTarget } from "@tabler/icons-react";
import React from "react";
import { WorkMap } from ".";
import { TimeframeSelector } from "../../TimeframeSelector";
import { WorkMapTab } from "./WorkMapTab";

export interface Props {
  activeTab: WorkMap.Filter;
  setTab: (tab: WorkMap.Filter) => void;
  timeframe: TimeframeSelector.Timeframe;
  setTimeframe: TimeframeSelector.SetTimeframe;
  tabOptions?: WorkMap.TabOptions;
}

export function WorkMapNavigation({ activeTab, setTab, timeframe, setTimeframe, tabOptions = {} }: Props) {
  return (
    <div className="overflow-x-auto bg-zinc-50 border-b border-stroke-base">
      <div className="">
        <div className="px-4">
          <nav className="flex justify-between items-center overflow-x-auto" aria-label="Work Map Tabs">
            <div className="flex space-x-4">
              <WorkMapTab
                label="All work"
                tab="all"
                isActive={activeTab === "all"}
                icon={<IconLayoutGrid size={16} />}
                testId="work-map-tab-all"
                hide={tabOptions.hideAll}
                setTab={setTab}
              />
              <WorkMapTab
                label="Goals"
                tab="goals"
                isActive={activeTab === "goals"}
                icon={<IconTarget size={16} />}
                testId="work-map-tab-goals"
                hide={tabOptions.hideGoals}
                setTab={setTab}
              />
              <WorkMapTab
                label="Projects"
                tab="projects"
                isActive={activeTab === "projects"}
                icon={<IconChecklist size={16} />}
                testId="work-map-tab-projects"
                hide={tabOptions.hideProjects}
                setTab={setTab}
              />
              <WorkMapTab
                label="Completed"
                tab="completed"
                isActive={activeTab === "completed"}
                icon={<IconCircleCheck size={16} />}
                testId="work-map-tab-completed"
                hide={tabOptions.hideCompleted}
                setTab={setTab}
              />
            </div>
          </nav>
        </div>
      </div>
    </div>
  );
}

export default WorkMapNavigation;
