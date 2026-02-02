import React, { ReactNode } from "react";
import { PageNew } from "../Page";
import { Tabs, TabsState } from "../Tabs";
import { StatusBanner } from "./StatusBanner";
import { PageHeader } from "./PageHeader";
import { BadgeStatus } from "../StatusBadge/types";
import { ProjectPermissions } from "../ProjectPage/types";

export namespace ProjectPageLayout {
  export interface Space {
    id: string;
    name: string;
    link: string;
  }

  export type SpaceProps =
    | {
        workmapLink: string;
        space: Space;
      }
    | {
        homeLink: string;
      };

  export interface ChildrenCount {
    tasksCount: number;
    discussionsCount: number;
    checkInsCount: number;
  }

  export type Props = SpaceProps & {
    title: string[];
    testId?: string;

    projectName: string;
    status: BadgeStatus;
    updateProjectName: (name: string) => Promise<boolean>;
    permissions: ProjectPermissions;

    state?: "paused" | "closed" | "active";
    closedAt: Date | null;
    reopenLink?: string;
    retrospectiveLink?: string;

    // Tabs
    tabs: TabsState;

    children: ReactNode;
  }
}

export function ProjectPageLayout(props: ProjectPageLayout.Props) {
  return (
    <PageNew title={props.title} size="fullwidth" testId={props.testId}>
      <PageHeader {...props} />

      {(props.state === "paused" || props.state === "closed") && (
        <StatusBanner state={props.state} closedAt={props.closedAt} reopenLink={props.reopenLink} retrospectiveLink={props.retrospectiveLink} />
      )}
      <Tabs tabs={props.tabs} />

      {props.children}
    </PageNew>
  );
}
