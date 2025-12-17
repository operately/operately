import React from "react";

import {
  IconCircleCheck,
  IconClipboardCheck,
  IconEye,
  IconChecklist,
  IconLogs,
  IconPlayerPause,
  IconUserCircle,
} from "../icons";

import { PageNew } from "../Page";
import { Tabs, useTabs } from "../Tabs";
import { Colleagues, Contact, PageHeader } from "./components";

import { WorkMap, WorkMapTable } from "../WorkMap";
import { processPersonalItems } from "../WorkMap/utils/itemProcessor";
import { sortItemsByClosedDate, sortItemsByDueDate } from "../WorkMap/utils/sort";
import { PersonCard } from "../PersonCard";

export namespace ProfilePage {
  export type Person = PersonCard.Person;

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

    viewer: Person | null;
  }

  export type TabOptions = "tasks" | "assigned" | "reviewing" | "paused" | "completed" | "activity" | "about";
}

export function ProfilePage(props: ProfilePage.Props) {
  const { tabs, items } = useTabsWithItems(props.workMap, props.reviewerWorkMap);

  const workMapColumnOptions = React.useMemo(() => {
    if (tabs.active === "tasks") {
      return { hideOwner: true, hideProgress: true };
    }

    return { hideOwner: true };
  }, [tabs.active]);

  return (
    <PageNew title={props.title} size="fullwidth">
      <PageHeader {...props} />
      <Tabs tabs={tabs} />

      {["tasks", "assigned", "reviewing", "paused", "completed"].includes(tabs.active) && (
        <WorkMapTable
          items={items[tabs.active]}
          tab={["completed", "paused"].includes(tabs.active) ? (tabs.active as WorkMap.Filter) : "all"}
          profileUser={props.person}
          viewer={props.viewer || undefined}
          columnOptions={workMapColumnOptions}
        />
      )}
      {tabs.active === "activity" && <ActivityFeed {...props} />}
      {tabs.active === "about" && <About {...props} />}
    </PageNew>
  );
}

function useTabsWithItems(workMap: WorkMap.Item[], reviewerWorkMap: WorkMap.Item[]) {
  const { tasks, assigned, reviewing, paused, completed } = React.useMemo(() => {
    const tasks = workMap.filter((i) => i.type === "task");

    const workMapWithoutTasks = workMap.filter((i) => i.type !== "task");
    const reviewerWorkMapWithoutTasks = reviewerWorkMap.filter((i) => i.type !== "task");

    const assignedData = processPersonalItems(workMapWithoutTasks);
    const reviewerData = processPersonalItems(reviewerWorkMapWithoutTasks);

    return {
      tasks: sortItemsByDueDate(tasks.map((t) => ({ ...t, children: [] }))),
      assigned: sortItemsByDueDate(assignedData.ongoingItems),
      reviewing: sortItemsByDueDate(reviewerData.ongoingItems),
      paused: sortItemsByDueDate([...assignedData.pausedItems, ...reviewerData.pausedItems]),
      completed: sortItemsByClosedDate([...assignedData.completedItems, ...reviewerData.completedItems]),
    };
  }, [workMap, reviewerWorkMap]);

  const tabs = useTabs("tasks", [
    { id: "tasks", label: "Tasks", icon: <IconChecklist size={14} />, count: tasks.length },
    { id: "assigned", label: "Assigned", icon: <IconClipboardCheck size={14} />, count: assigned.length },
    { id: "reviewing", label: "Reviewing", icon: <IconEye size={14} />, count: reviewing.length },
    { id: "paused", label: "Paused", icon: <IconPlayerPause size={14} />, count: paused.length },
    { id: "completed", label: "Completed", icon: <IconCircleCheck size={14} />, count: completed.length },
    { id: "activity", label: "Activity", icon: <IconLogs size={14} /> },
    { id: "about", label: "About", icon: <IconUserCircle size={14} /> },
  ]);

  return {
    tabs,
    items: { tasks, assigned, reviewing, paused, completed },
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
