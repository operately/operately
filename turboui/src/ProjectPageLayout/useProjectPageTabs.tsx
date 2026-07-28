import React from "react";
import { IconClipboardText, IconListCheck, IconLogs, IconMessage, IconMessages } from "../icons";
import { useTabs, type TabsState } from "../Tabs";
import type { ProjectPageLayout } from "./index";

export type ProjectPageTabId = "overview" | "tasks" | "check-ins" | "discussions" | "docs-and-files" | "activity";

export interface UseProjectPageTabsOptions {
  defaultTab: ProjectPageTabId;
  childrenCount: ProjectPageLayout.ChildrenCount;
  showDocsAndFiles: boolean;
  urlPath?: string;
}

/**
 * Single source of truth for project-context page tabs (Project, Milestone, Task).
 * Child pages pass urlPath so tabs navigate to the project page.
 */
export function useProjectPageTabs({
  defaultTab,
  childrenCount,
  showDocsAndFiles,
  urlPath,
}: UseProjectPageTabsOptions): TabsState {
  return useTabs(
    defaultTab,
    [
      { id: "overview", label: "Overview", icon: <IconClipboardText size={14} /> },
      {
        id: "tasks",
        label: "Tasks",
        icon: <IconListCheck size={14} />,
        count: childrenCount.tasksCount,
      },
      {
        id: "check-ins",
        label: "Check-ins",
        icon: <IconMessage size={14} />,
        count: childrenCount.checkInsCount,
      },
      {
        id: "discussions",
        label: "Discussions",
        icon: <IconMessages size={14} />,
        count: childrenCount.discussionsCount,
      },
      {
        id: "docs-and-files",
        label: "Docs & Files",
        icon: <IconClipboardText size={14} />,
        hidden: !showDocsAndFiles,
      },
      { id: "activity", label: "Activity", icon: <IconLogs size={14} /> },
    ],
    urlPath ? { urlPath } : undefined,
  );
}
