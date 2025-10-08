import React from "react";

import { Navigation } from "../../Page/Navigation";
import { PrivacyIndicator } from "../../PrivacyIndicator";

import { DateField } from "../../DateField";
import { PageNew } from "../../Page";
import { SpaceField } from "../../SpaceField";
import { useWorkMapTab } from "../hooks/useWorkMapTab";
import { AddItemModal } from "./AddItemModal";
import { WorkMapNavigation } from "./WorkMapNavigation";
import { WorkMapTable } from "./WorkMapTable";

export { WorkMapTable };

export function WorkMapPage(props: WorkMap.Props) {
  return (
    <PageNew title={props.title}>
      <WorkMap {...props} />
    </PageNew>
  );
}

export function WorkMap({
  title,
  items,
  columnOptions = {},
  tabOptions = {},
  type = "company",
  addItem,
  addingEnabled = false,
  spaceSearch,
  addItemDefaultSpace,
}: WorkMap.Props) {
  const { filteredItems, tabsState, tab } = useWorkMapTab({ rawItems: items, type, opts: { tabOptions } });

  return (
    <div className="flex flex-col w-full bg-surface-base rounded-lg">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-4 sm:px-6 py-3 border-b border-surface-outline">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <h1 className="text-sm sm:text-base font-bold text-content-accent">{title}</h1>
        </div>
      </header>
      <div className="flex-1 overflow-auto">
        <WorkMapNavigation tabsState={tabsState} />
        <WorkMapTable
          items={filteredItems}
          tab={tab}
          columnOptions={columnOptions}
          addItem={addItem}
          addingEnabled={addingEnabled}
          spaceSearch={spaceSearch}
          addItemDefaultSpace={addItemDefaultSpace}
          type={type}
        />
      </div>
    </div>
  );
}

export default WorkMap;

export namespace WorkMap {
  export const ALLOWED_STATUSES = [
    "on_track",
    "achieved",
    "missed",
    "paused",
    "caution",
    "off_track",
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
    link: string;
  }

  interface Timeframe {
    startDate: DateField.ContextualDate | null;
    endDate: DateField.ContextualDate | null;
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

  export type WorkMapType = "company" | "personal";
  export type Filter = "all" | "goals" | "projects" | "completed" | "paused";

  export interface TabOptions {
    hideAll?: boolean;
    hideGoals?: boolean;
    hideProjects?: boolean;
    hideCompleted?: boolean;
    hidePaused?: boolean;
  }

  export interface ColumnOptions {
    hideSpace?: boolean;
    hideStatus?: boolean;
    hideProgress?: boolean;
    hideDueDate?: boolean;
    hideOwner?: boolean;
    hideNextStep?: boolean;
  }

  export type AddNewItemFn = (props: AddItemModal.SaveProps) => Promise<{ id: string }>;

  export interface Props {
    title: string;

    items: Item[];
    addItem?: AddNewItemFn;
    addingEnabled?: boolean;
    spaceSearch?: SpaceField.SearchSpaceFn;
    addItemDefaultSpace?: SpaceField.Space;

    columnOptions?: ColumnOptions;
    tabOptions?: TabOptions;
    type?: WorkMapType;
    navigation?: Navigation.Item[];
  }
}
