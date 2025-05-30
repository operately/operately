import React from "react";

import { IconLogs, IconEye, IconClipboardCheck, IconUserCircle } from "@tabler/icons-react";

import { Page } from "../Page";
import { Tabs, useTabs } from "../Tabs";
import { WorkMap } from "../WorkMap";
import { Colleagues, PageHeader, Contact } from "./components";

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
}

export function ProfilePage(props: ProfilePage.Props) {
  const tabs = useTabs("overview", [
    { id: "assigned", label: "Assigned", icon: <IconClipboardCheck size={14} /> },
    { id: "reviewing", label: "Reviewing", icon: <IconEye size={14} /> },
    { id: "activity", label: "Recent activity", icon: <IconLogs size={14} /> },
    { id: "about", label: "About", icon: <IconUserCircle size={14} /> },
  ]);

  return (
    <Page title={props.title} size="fullwidth">
      <PageHeader person={props.person} />
      <Tabs tabs={tabs} />

      {tabs.active === "assigned" && <WorkMap title="Assigned work" items={props.workMap} type="personal" />}
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
