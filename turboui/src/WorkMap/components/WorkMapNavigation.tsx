import { WorkMapTab } from "./WorkMapTab";
import { IconLayoutGrid, IconTarget, IconChecklist, IconCircleCheck } from "@tabler/icons-react";
import { WorkMap } from ".";
import { TimeframeSelector } from "../../TimeframeSelector";

export interface Props {
  activeTab: WorkMap.Filter;
  onTabChange: (filter: WorkMap.Filter) => void;
  timeframe: TimeframeSelector.Timeframe;
  setTimeframe: TimeframeSelector.SetTimeframe;
  tabOptions?: WorkMap.TabOptions;
}

export function WorkMapNavigation({ activeTab, onTabChange, timeframe, setTimeframe, tabOptions = {} }: Props) {
  return (
    <div className="overflow-x-auto">
      <div className="border-b border-surface-outline">
        <div className="px-4 sm:px-6">
          <nav className="flex justify-between items-center overflow-x-auto pb-1" aria-label="Work Map Tabs">
            <div className="flex space-x-4">
              <WorkMapTab
                label="All work"
                isActive={activeTab === "all"}
                onClick={() => onTabChange("all")}
                icon={<IconLayoutGrid size={16} />}
                testId="work-map-tab-all"
                hide={tabOptions.hideAll}
              />
              <WorkMapTab
                label="Goals"
                isActive={activeTab === "goals"}
                onClick={() => onTabChange("goals")}
                icon={<IconTarget size={16} />}
                testId="work-map-tab-goals"
                hide={tabOptions.hideGoals}
              />
              <WorkMapTab
                label="Projects"
                isActive={activeTab === "projects"}
                onClick={() => onTabChange("projects")}
                icon={<IconChecklist size={16} />}
                testId="work-map-tab-projects"
                hide={tabOptions.hideProjects}
              />
              <WorkMapTab
                label="Completed"
                isActive={activeTab === "completed"}
                onClick={() => onTabChange("completed")}
                icon={<IconCircleCheck size={16} />}
                testId="work-map-tab-completed"
                hide={tabOptions.hideCompleted}
              />
            </div>

            <div className="mt-1">
              <TimeframeSelector timeframe={timeframe} setTimeframe={setTimeframe} size="xs" />
            </div>
          </nav>
        </div>
      </div>
    </div>
  );
}

export default WorkMapNavigation;
