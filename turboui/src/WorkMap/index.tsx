import { useState } from "react";

import { TimeframeSelector } from "../TimeframeSelector";
import { currentYear } from "../TimeframeSelector/utils";

import { WorkMapNavigation } from "./WorkMapNavigation";
import { WorkMapTable } from "./WorkMapTable";
import { useWorkMapFilter } from "./useWorkMapFilter";

export { parseToWorkMapItems } from "./parse";

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
    | "pending";

  export interface Person {
    id: string;
    fullName: string;
    avatarUrl?: string;
  }

  export interface DateInfo {
    display: string;
    isPast?: boolean;
  }

  export type ItemType = "goal" | "project";

  interface BaseItem {
    id: string;
    parentId?: string;
    name: string;
    status: Status;
    progress: number;
    deadline?: DateInfo;
    closedAt?: string;
    space: string;
    owner: Person;
    nextStep: string;
    isNew?: boolean;
    children?: Item[];
    completedOn?: string;
  }

  interface GoalItem extends BaseItem {
    type: "goal";
    timeframe: TimeframeSelector.Timeframe;
  }

  interface ProjectItem extends BaseItem {
    type: "project";
    startedAt: string;
  }

  export type Item = GoalItem | ProjectItem;

  export interface NewItem {
    parentId: string | null;
    name: string;
    type: ItemType;
  }

  export type Filter = "all" | "goals" | "projects" | "completed";

  export interface Props {
    title: string;
    items: Item[];
    addItem: (newItem: NewItem) => void;
    deleteItem: (itemId: string) => void;
  }
}

const defaultTimeframe = currentYear();

export function WorkMap({ title, items, addItem, deleteItem }: WorkMap.Props) {
  const [timeframe, setTimeframe] = useState(defaultTimeframe);
  const { filteredItems, filter, setFilter } = useWorkMapFilter(items, timeframe);

  return (
    <div className="flex flex-col w-full bg-surface-base">
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
        />
        <WorkMapTable items={filteredItems} filter={filter} deleteItem={deleteItem} addItem={addItem} />
      </div>
    </div>
  );
}

export default WorkMap;
