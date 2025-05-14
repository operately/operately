import { useState } from "react";

import { TimeframeSelector } from "../../TimeframeSelector";
import { currentYear } from "../../utils/timeframes";
import { PrivacyIndicator } from "../../PrivacyIndicator";

import { WorkMapNavigation } from "./WorkMapNavigation";
import { WorkMapTable } from "./WorkMapTable";
import { useWorkMapTab } from "../hooks/useWorkMapTab";

const defaultTimeframe = currentYear();

export function WorkMap({ title, items, columnOptions = {}, tabOptions = {} }: WorkMap.Props) {
  const [timeframe, setTimeframe] = useState(defaultTimeframe);
  const { filteredItems, tab, setTab } = useWorkMapTab(items, timeframe, { tabOptions });

  return (
    <div className="flex flex-col w-full bg-surface-base rounded-lg">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-4 sm:px-6 py-3 border-b border-surface-outline">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <h1 className="text-sm sm:text-base font-bold text-content-accent">{title}</h1>
        </div>
      </header>
      <div className="flex-1 overflow-auto">
        <WorkMapNavigation
          activeTab={tab}
          setTab={setTab}
          timeframe={timeframe}
          setTimeframe={setTimeframe}
          tabOptions={tabOptions}
        />
        <WorkMapTable items={filteredItems} tab={tab} columnOptions={columnOptions} />
      </div>
    </div>
  );
}

export default WorkMap;

export namespace WorkMap {
  interface Person {
    id: string;
    fullName: string;
    avatarUrl: string | null;
  }

  interface Space {
    id: string;
    name: string;
  }

  interface Timeframe {
    startDate?: string;
    endDate?: string;
    type?: TimeframeSelector.TimeframeType;
  }

  export interface Item {
    id: string;
    parentId: string | null;
    name: string;
    status: "on_track" | "completed" | "achieved" | "partial" | "missed" | "paused" | "caution" | "issue" | "dropped" | "pending" | "outdated";
    progress: number;
    space: Space;
    spacePath: string;
    owner: Person | null;
    ownerPath: string;
    nextStep: string;
    isNew: boolean;
    children: Item[];
    completedOn: string | null;
    timeframe: Timeframe | null;
    type: "goal" | "project";
    itemPath: string;
    privacy: PrivacyIndicator.PrivacyLevels;
  }

  export type Filter = "all" | "goals" | "projects" | "completed";

  export interface TabOptions {
    hideAll?: boolean;
    hideGoals?: boolean;
    hideProjects?: boolean;
    hideCompleted?: boolean;
  }

  export interface ColumnOptions {
    hideSpace?: boolean;
    hideStatus?: boolean;
    hideProgress?: boolean;
    hideDeadline?: boolean;
    hideOwner?: boolean;
    hideNextStep?: boolean;
  }

  export interface Props {
    title: string;
    items: Item[];
    columnOptions?: ColumnOptions;
    tabOptions?: TabOptions;
  }
}
