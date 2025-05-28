import React from "react";
import { Tabs, TabsState } from "../../Tabs";

export interface Props {
  tabsState: TabsState;
}

export function WorkMapNavigation({ tabsState }: Props) {
  return (
    <div className="overflow-x-auto">
      <Tabs tabs={tabsState} />
    </div>
  );
}

export default WorkMapNavigation;
