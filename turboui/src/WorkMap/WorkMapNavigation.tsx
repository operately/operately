import React from "react";
import { WorkMapTab } from "./WorkMapTab";
import classNames from "../utils/classnames";
import { 
  IconLayoutGrid, 
  IconTarget, 
  IconChecklist, 
  IconCircleCheck 
} from "@tabler/icons-react";

export interface WorkMapNavigationProps {
  activeTab: string;
}

/**
 * Navigation component for switching between different WorkMap views
 */
export function WorkMapNavigation({ activeTab }: WorkMapNavigationProps): React.ReactElement {
  return (
    <div className="border-b border-surface-outline">
      <div className="px-4 sm:px-6">
        <nav
          className="flex justify-between overflow-x-auto pb-1"
          aria-label="Work Map Tabs"
        >
          <div className="flex space-x-4">
            <WorkMapTab
              label="All work"
              to="/work-map"
              isActive={activeTab === "all"}
              icon={<IconLayoutGrid size={16} />}
            />
            <WorkMapTab
              label="Goals"
              to="/work-map-goals"
              isActive={activeTab === "goals"}
              icon={<IconTarget size={16} />}
            />
            <WorkMapTab
              label="Projects"
              to="/work-map-projects"
              isActive={activeTab === "projects"}
              icon={<IconChecklist size={16} />}
            />
            <WorkMapTab
              label="Completed"
              to="/work-map-completed"
              isActive={activeTab === "completed"}
              icon={<IconCircleCheck size={16} />}
            />
          </div>
        </nav>
      </div>
    </div>
  );
}

export default WorkMapNavigation;