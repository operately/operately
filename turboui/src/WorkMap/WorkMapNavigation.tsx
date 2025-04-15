import { WorkMapTab } from "./WorkMapTab";
import {
  IconLayoutGrid,
  IconTarget,
  IconChecklist,
  IconCircleCheck,
} from "@tabler/icons-react";
import { WorkMapFilter } from "./types";


export interface Props {
  activeTab: WorkMapFilter;
  onTabChange: (filter: WorkMapFilter) => void;
}

/**
 * Navigation component for switching between different WorkMap views
 */
export function WorkMapNavigation({ activeTab, onTabChange }: Props) {
  return (
    <div className="overflow-x-auto">
      <div className="border-b border-surface-outline">
        <div className="px-4 sm:px-6">
          <nav
            className="flex justify-between overflow-x-auto pb-1"
            aria-label="Work Map Tabs"
          >
            <div className="flex space-x-4">
              <WorkMapTab
                label="All work"
                isActive={activeTab === "all"}
                onClick={() => onTabChange("all")}
                icon={<IconLayoutGrid size={16} />}
              />
              <WorkMapTab
                label="Goals"
                isActive={activeTab === "goals"}
                onClick={() => onTabChange("goals")}
                icon={<IconTarget size={16} />}
              />
              <WorkMapTab
                label="Projects"
                isActive={activeTab === "projects"}
                onClick={() => onTabChange("projects")}
                icon={<IconChecklist size={16} />}
              />
              <WorkMapTab
                label="Completed"
                isActive={activeTab === "completed"}
                onClick={() => onTabChange("completed")}
                icon={<IconCircleCheck size={16} />}
              />
            </div>
          </nav>
        </div>
      </div>
    </div>
  );
}

export default WorkMapNavigation;
