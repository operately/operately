import React from "react";

import { IconLogs, IconEye, IconClipboardCheck, IconUserCircle, IconCircleCheck } from "@tabler/icons-react";

import { Page } from "../Page";
import { Tabs, useTabs } from "../Tabs";
import { Colleagues, PageHeader, Contact } from "./components";

import { WorkMap, WorkMapTable } from "../WorkMap";
import { processPersonalItems } from "../WorkMap/utils/itemProcessor";

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

    activityFeed: React.ReactNode;
  }

  export type TabOptions = "assigned" | "reviewing" | "completed" | "activity" | "about";
}

export function ProfilePage(props: ProfilePage.Props) {
  const tabs = useTabs("assigned", [
    { id: "assigned", label: "Assigned", icon: <IconClipboardCheck size={14} /> },
    { id: "reviewing", label: "Reviewing", icon: <IconEye size={14} /> },
    { id: "completed", label: "Completed", icon: <IconCircleCheck size={14} /> },
    { id: "activity", label: "Activity", icon: <IconLogs size={14} /> },
    { id: "about", label: "About", icon: <IconUserCircle size={14} /> },
  ]);

  const items = React.useMemo(() => {
    const data = processPersonalItems(props.workMap);
    return data.ongoingItems;
  }, [props.workMap]);

  return (
    <Page title={props.title} size="fullwidth">
      <PageHeader person={props.person} />
      <Tabs tabs={tabs} />

      {["assigned", "reviewing", "completed"].includes(tabs.active) && <WorkMapTable items={items} tab="all" />}
      {tabs.active === "activity" && <ActivityFeed {...props} />}
      {tabs.active === "about" && <About {...props} />}
    </Page>
  );
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
