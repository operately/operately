import React, { useState } from "react";

import { Page } from "../../Page";
import { PrivacyIndicator } from "../../PrivacyIndicator";
import { TimeframeSelector } from "../../TimeframeSelector";
import { currentYear } from "../../utils/timeframes";

import { useWorkMapTab } from "../hooks/useWorkMapTab";
import { WorkMapNavigation } from "./WorkMapNavigation";
import { WorkMapTable } from "./WorkMapTable";

const defaultTimeframe = currentYear();

export function WorkMapPage(props: WorkMap.Props) {
  const navigation = [
    {
      label: "Home",
      to: "#",
    },
    {
      label: "Work Map",
      to: "#",
    },
  ];

  return (
    <Page title={props.title} size="fullwidth" navigation={navigation}>
      <WorkMap {...props} />
    </Page>
  );
}

export function WorkMap({ items, columnOptions = {}, tabOptions = {} }: WorkMap.Props) {
  const [timeframe, setTimeframe] = useState(defaultTimeframe);
  const { filteredItems, tab, setTab } = useWorkMapTab(items, timeframe, { tabOptions });

  return (
    <div className="flex flex-col w-full">
      <WorkMapNavigation
        activeTab={tab}
        setTab={setTab}
        timeframe={timeframe}
        setTimeframe={setTimeframe}
        tabOptions={tabOptions}
      />
      <div className="text-xl font-bold mt-6 mb-4 px-4">All ongoing work in the company</div>
      <div className="flex-1 overflow-auto">
        <WorkMapTable items={filteredItems} tab={tab} columnOptions={columnOptions} />
      </div>
    </div>
  );
}

export default WorkMap;

export namespace WorkMap {
  export const ALLOWED_STATUSES = [
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
  ] as const;
  const ALLOWED_TYPES = ["goal", "project"] as const;

  type ItemStatus = (typeof ALLOWED_STATUSES)[number];
  type ItemType = (typeof ALLOWED_TYPES)[number];

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
    status: ItemStatus;
    progress: number;
    space: Space;
    spacePath: string;
    owner: Person | null;
    ownerPath: string | null;
    nextStep: string;
    isNew: boolean;
    children: Item[];
    completedOn: string | null;
    timeframe: Timeframe | null;
    type: ItemType;
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
