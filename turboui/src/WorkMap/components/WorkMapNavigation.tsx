import React from "react";
import { WorkMapTab } from "./WorkMapTab";
import { IconLayoutGrid, IconTarget, IconChecklist, IconCircleCheck, IconCalendarPause } from "@tabler/icons-react";
import { WorkMap } from ".";

export interface Props {
  activeTab: WorkMap.Filter;
  setTab: (tab: WorkMap.Filter) => void;
  tabOptions?: WorkMap.TabOptions;
}

export function WorkMapNavigation({ activeTab, setTab, tabOptions = {} }: Props) {
  return (
    <div className="overflow-x-auto">
      <div className="border-b border-surface-outline">
        <div className="px-4 sm:px-6">
          <nav className="flex justify-between items-center overflow-x-auto pb-1" aria-label="Work Map Tabs">
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
                label="Paused"
                tab="paused"
                isActive={activeTab === "paused"}
                icon={<IconCalendarPause size={16} />}
                testId="work-map-tab-paused"
                hide={tabOptions.hidePaused}
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
