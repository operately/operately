import React from "react";
import { Page } from "../Page";
import { WorkMapNavigation } from "./WorkMapNavigation";
import { WorkMapTable } from "./WorkMapTable";
import { WorkMapItem } from "./types";

export interface WorkMapProps {
  items: WorkMapItem[];
  addItem: (parentId: string | null, newItem: WorkMapItem) => void;
  deleteItem: (itemId: string) => void;
}

export function WorkMap({ items, addItem, deleteItem }: WorkMapProps) {
  return (
    <Page title="Company work map" size="fullwidth">
      <div className="flex flex-col w-full">
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-4 sm:px-6 py-3 border-b border-surface-outline">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <h1 className="text-sm sm:text-base font-bold text-content-accent">
              Company work map
            </h1>
          </div>
        </header>
        <div className="flex-1 overflow-auto">
          <WorkMapNavigation activeTab="all" />
          <WorkMapTable items={items} deleteItem={deleteItem} />
        </div>
      </div>
    </Page>
  );
}

export default WorkMap;
