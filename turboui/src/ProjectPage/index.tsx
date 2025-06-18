import React from "react";

import { PageNew } from "../Page";

import { IconClipboardText, IconLogs, IconMessage, IconMessages, IconSubtask } from "@tabler/icons-react";

import { PrivacyField } from "../PrivacyField";
import { BadgeStatus } from "../StatusBadge/types";
import { Tabs, useTabs } from "../Tabs";
import { PageHeader } from "./PageHeader";

export namespace ProjectPage {
  export interface Space {
    id: string;
    name: string;
    link: string;
  }

  export interface Person {
    id: string;
    fullName: string;
    avatarUrl: string | null;
    title: string;
    profileLink: string;
  }

  export interface Props {
    closeLink: string;
    reopenLink: string;

    projectName: string;
    description?: string;

    space: Space;
    setSpace: (space: Space) => void;
    spaceSearch: (params: { query: string }) => Promise<Space[]>;

    champion: Person | null;
    setChampion: (person: Person | null) => void;

    status: BadgeStatus;
    state: "active" | "closed";

    closedAt: Date | null;

    canEdit: boolean;
    accessLevels: PrivacyField.AccessLevels;
    setAccessLevels: (levels: PrivacyField.AccessLevels) => void;

    updateProjectName: (name: string) => Promise<boolean>;
    updateDescription: (description: string | null) => Promise<boolean>;

    activityFeed: React.ReactNode;
  }

  export interface State extends Props {}
}

function useProjectPageState(props: ProjectPage.Props): ProjectPage.State {
  return {
    ...props,
  };
}

export function ProjectPage(props: ProjectPage.Props) {
  const state = useProjectPageState(props);

  const tabs = useTabs("overview", [
    { id: "overview", label: "Overview", icon: <IconClipboardText size={14} /> },
    { id: "tasks", label: "Tasks", icon: <IconSubtask size={14} /> },
    { id: "check-ins", label: "Check-ins", icon: <IconMessage size={14} /> },
    { id: "discussions", label: "Discussions", icon: <IconMessages size={14} /> },
    { id: "activity", label: "Activity", icon: <IconLogs size={14} /> },
  ]);

  return (
    <PageNew title={[state.projectName]} size="fullwidth" testId="project-page">
      <PageHeader {...state} />
      <Tabs tabs={tabs} />

      <div className="flex-1 overflow-scroll">
        {tabs.active === "overview" && <div className="p-4">Overview content will go here</div>}
        {tabs.active === "tasks" && <div className="p-4">Tasks content will go here</div>}
        {tabs.active === "check-ins" && <div className="p-4">Check-ins content will go here</div>}
        {tabs.active === "discussions" && <div className="p-4">Discussions content will go here</div>}
        {tabs.active === "activity" && <div className="p-4">Activity content will go here</div>}
      </div>
    </PageNew>
  );
}