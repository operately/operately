import React from "react";

import { IconCircleCheck, IconClipboardCheck, IconEye, IconLogs, IconPlayerPause, IconUserCircle } from "../icons";

import { PageNew } from "../Page";
import { Tabs, useTabs } from "../Tabs";
import { Colleagues, Contact, PageHeader } from "./components";

import { WorkMap, WorkMapTable } from "../WorkMap";
import { processPersonalItems } from "../WorkMap/utils/itemProcessor";
import { sortItemsByClosedDate, sortItemsByDueDate } from "../WorkMap/utils/sort";

export namespace ProfilePage {
  export interface Person {
    id: string;
    fullName: string;
    email: string;
    avatarUrl: string | null;
    title: string;
    link: string;
  }

  export interface Props {
    title: string | string[];

    person: Person;
    manager: Person | null;
    peers: Person[];
    reports: Person[];

    workMap: WorkMap.Item[];
    reviewerWorkMap: WorkMap.Item[];

    activityFeed: React.ReactNode;

    editProfilePath: string;
    canEditProfile: boolean;
  }

  export type TabOptions = "assigned" | "reviewing" | "completed" | "activity" | "about";
}

export function ProfilePage(props: ProfilePage.Props) {
  const { tabs, items } = useTabsWithItems(props.workMap, props.reviewerWorkMap);

  return (
    <PageNew title={props.title} size="fullwidth">
      <PageHeader {...props} />
      <Tabs tabs={tabs} />

      {["assigned", "reviewing", "paused", "completed"].includes(tabs.active) && (
        <WorkMapTable
          items={items[tabs.active]}
          tab={["completed", "paused"].includes(tabs.active) ? (tabs.active as WorkMap.Filter) : "all"}
        />
      )}
      {tabs.active === "activity" && <ActivityFeed {...props} />}
      {tabs.active === "about" && <About {...props} />}
    </PageNew>
  );
}

function useTabsWithItems(workMap: WorkMap.Item[], reviewerWorkMap: WorkMap.Item[]) {
  const { assigned, reviewing, paused, completed } = React.useMemo(() => {
    const assignedData = processPersonalItems(workMap);
    const reviewerData = processPersonalItems(reviewerWorkMap);

    return {
      assigned: sortItemsByDueDate(assignedData.ongoingItems),
      reviewing: sortItemsByDueDate(reviewerData.ongoingItems),
      paused: sortItemsByDueDate(assignedData.pausedItems),
      completed: sortItemsByClosedDate(assignedData.completedItems),
    };
  }, [workMap, reviewerWorkMap]);

  const tabs = useTabs("assigned", [
    { id: "assigned", label: "Assigned", icon: <IconClipboardCheck size={14} />, count: assigned.length },
    { id: "reviewing", label: "Reviewing", icon: <IconEye size={14} />, count: reviewing.length },
    { id: "paused", label: "Paused", icon: <IconPlayerPause size={14} />, count: paused.length },
    { id: "completed", label: "Completed", icon: <IconCircleCheck size={14} />, count: completed.length },
    { id: "activity", label: "Activity", icon: <IconLogs size={14} /> },
    { id: "about", label: "About", icon: <IconUserCircle size={14} /> },
  ]);

  return {
    tabs,
    items: { assigned, reviewing, paused, completed },
  };
}

function ActivityFeed(props: ProfilePage.Props) {
  return (
    <div className="p-4 max-w-5xl mx-auto my-6">
      <div className="font-bold text-lg mb-4">Recent activity</div>
      {props.activityFeed}
    </div>
  );
}

function About(props: ProfilePage.Props) {
  return (
    <div className="p-4 max-w-5xl mx-auto my-6">
      <div className="flex flex-col divide-y divide-stroke-base">
        <Contact person={props.person} />
        <Colleagues {...props} />
      </div>
    </div>
  );
}
