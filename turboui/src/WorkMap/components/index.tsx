import { useState } from "react";

import { TimeframeSelector } from "../../TimeframeSelector";
import { currentYear } from "../../utils/timeframes";
import { PrivacyIndicator } from "../../PrivacyIndicator";

import { WorkMapNavigation } from "./WorkMapNavigation";
import { WorkMapTable } from "./WorkMapTable";
import { useWorkMapFilter } from "../hooks/useWorkMapFilter";

export namespace WorkMap {
  export type Status =
    | "on_track"
    | "completed"
    | "achieved"
    | "partial"
    | "missed"
    | "paused"
    | "caution"
    | "issue"
    | "dropped"
    | "pending"
    | "outdated";

  export interface Person {
    id: string;
    fullName: string;
    avatarUrl?: string;
  }

  interface Space {
    id: string;
    name: string;
  }

  export type ItemType = "goal" | "project";

  type Optional<T> = T | null | undefined;

  interface Timeframe {
    startDate: Optional<string>;
    endDate: Optional<string>;
    type: Optional<TimeframeSelector.TimeframeType>;
  }

  export interface Item {
    id: Optional<string>;
    parentId: Optional<string>;
    name: Optional<string>;
    status: Status;
    progress: Optional<number>;
    closedAt: Optional<string>;
    space: Optional<Space>;
    spacePath: Optional<string>;
    owner: Optional<Person>;
    ownerPath: Optional<string>;
    nextStep: Optional<string>;
    isNew: Optional<boolean>;
    children: Optional<Item[]>;
    completedOn: Optional<string>;
    timeframe: Optional<Timeframe>;
    type: "goal" | "project";
    itemPath: Optional<string>;
    privacy: Optional<PrivacyIndicator.PrivacyLevels>;
  }

  export interface NewItem {
    parentId: string | null;
    name: string;
    type: ItemType;
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

const defaultTimeframe = currentYear();

export function WorkMap({ title, items, columnOptions = {}, tabOptions = {} }: WorkMap.Props) {
  const [timeframe, setTimeframe] = useState(defaultTimeframe);
  const { filteredItems, filter, setFilter } = useWorkMapFilter(items, timeframe, { tabOptions });

  return (
    <div className="flex flex-col w-full bg-surface-base rounded-lg">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-4 sm:px-6 py-3 border-b border-surface-outline">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <h1 className="text-sm sm:text-base font-bold text-content-accent">{title}</h1>
        </div>
      </header>
      <div className="flex-1 overflow-auto">
        <WorkMapNavigation
          activeTab={filter}
          onTabChange={setFilter}
          timeframe={timeframe}
          setTimeframe={setTimeframe}
          tabOptions={tabOptions}
        />
        <WorkMapTable items={filteredItems} filter={filter} columnOptions={columnOptions} />
      </div>
    </div>
  );
}

export default WorkMap;
