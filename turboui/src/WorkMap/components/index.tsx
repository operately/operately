import { useState } from "react";
import { z } from "zod";

import { TimeframeSelector } from "../../TimeframeSelector";
import { currentYear } from "../../utils/timeframes";
import { PrivacyIndicator } from "../../PrivacyIndicator";

import { WorkMapNavigation } from "./WorkMapNavigation";
import { WorkMapTable } from "./WorkMapTable";
import { useWorkMapFilter } from "../hooks/useWorkMapFilter";

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

export namespace WorkMap {
  const PersonSchema = z.object({
    id: z.string(),
    fullName: z.string(),
    avatarUrl: z.string().optional(),
  });

  const SpaceSchema = z.object({
    id: z.string(),
    name: z.string(),
  });

  const TimeframeSchema = z.object({
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    type: z.custom<TimeframeSelector.TimeframeType>().optional(),
  });

  const ItemSchema = z.object({
    id: z.string(),
    parentId: z.string().nullable(),
    name: z.string(),
    status: z.enum([
      "on_track",
      "completed",
      "achieved",
      "partial",
      "missed",
      "paused",
      "caution",
      "issue",
      "dropped",
      "pending",
      "outdated",
    ]),
    progress: z.number(),
    space: SpaceSchema,
    spacePath: z.string(),
    owner: PersonSchema,
    ownerPath: z.string(),
    nextStep: z.string(),
    isNew: z.boolean(),
    children: z.array(z.lazy(() => ItemSchema)),
    completedOn: z.string().nullable(),
    timeframe: TimeframeSchema,
    type: z.enum(["goal", "project"]),
    itemPath: z.string(),
    privacy: z.custom<PrivacyIndicator.PrivacyLevels>(),
  });

  export type Item = z.infer<typeof ItemSchema>;

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
