import type { TaskListInteraction } from "../RichEditor/taskLists";
import React from "react";
import { useTranslation } from "react-i18next";

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
import { AboutMe, Colleagues, Contact, PageHeader } from "./components";

import type { FormattedTimePreferences } from "../FormattedTime";
import { WorkMap, WorkMapTable } from "../WorkMap";
import { processPersonalItems } from "../WorkMap/utils/itemProcessor";
import { sortItemsByClosedDate, sortItemsByDueDate } from "../WorkMap/utils/sort";
import { sortPersonalTasks } from "./taskOrdering";
import { compareIds } from "../utils/ids";
import { showErrorToast } from "../Toasts";
import { PersonCard } from "../PersonCard";
import { isContentEmpty } from "../RichContent";
import { MentionedPersonLookupFn } from "../RichEditor/useEditor";
import { match } from "ts-pattern";

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
    taskOrdering: string[];
    onTaskOrderingChange: (taskIds: string[]) => Promise<void>;
    taskOrderingSaving: boolean;

    activityFeed: React.ReactNode;

    editProfilePath: string;
    canEditProfile: boolean;

    viewer: Person | null;

    aboutMe?: string | null;
    mentionedPersonLookup: MentionedPersonLookupFn;
    taskList: TaskListInteraction;
    formattedTimePreferences: FormattedTimePreferences;
  }

  export type TabOptions = "tasks" | "assigned" | "reviewing" | "paused" | "completed" | "activity" | "about";
}

export function ProfilePage(props: ProfilePage.Props) {
  const { t } = useTranslation();
  const { tabs, items } = useTabsWithItems(props.workMap, props.reviewerWorkMap, props.taskOrdering);
  const canReorder = tabs.active === "tasks" && compareIds(props.viewer?.id, props.person.id);

  const saveOrdering = async (ids: string[]) => {
    if (!canReorder || props.taskOrderingSaving) return;
    try {
      await props.onTaskOrderingChange(ids);
    } catch {
      showErrorToast(t("Error"), t("Could not save task order. Please try again."));
    }
  };

  const reorderTask = (id: string, newIndex: number) => {
    const ids = items.tasks.map((task) => task.id);
    const oldIndex = ids.indexOf(id);
    if (oldIndex < 0 || oldIndex === newIndex || newIndex < 0 || newIndex >= ids.length) return;
    ids.splice(oldIndex, 1);
    ids.splice(newIndex, 0, id);
    void saveOrdering(ids);
  };

  const workMapColumnOptions = React.useMemo(() => {
    return match(tabs.active)
      .with("tasks", () => ({
        hideOwner: true,
        hideProgress: true,
        hideNextStep: true,
        hideRole: true,
        hideAssignedDate: false,
      }))
      .otherwise(() => ({ hideOwner: true, hideProject: true, hideAssignedDate: true }));
  }, [tabs.active]);

  const zeroStateMessage = React.useMemo(() => {
    return match(tabs.active)
      .with("tasks", () => t("Assigned tasks will appear here."))
      .otherwise(() => undefined);
  }, [tabs.active, t]);

  return (
    <PageNew title={props.title} size="fullwidth">
      <PageHeader {...props} />
      <Tabs tabs={tabs} />

      {["tasks", "assigned", "reviewing", "paused", "completed"].includes(tabs.active) && (
        <WorkMapTable
          onReorder={canReorder ? reorderTask : undefined}
          reorderingDisabled={props.taskOrderingSaving}
          items={items[tabs.active]}
          tab={["completed", "paused"].includes(tabs.active) ? (tabs.active as WorkMap.Filter) : "all"}
          profileUser={props.person}
          viewer={props.viewer || undefined}
          columnOptions={workMapColumnOptions}
          zeroStateMessage={zeroStateMessage}
          formattedTimePreferences={props.formattedTimePreferences}
        />
      )}
      {tabs.active === "activity" && <ActivityFeed {...props} />}
      {tabs.active === "about" && <About {...props} />}
    </PageNew>
  );
}

function useTabsWithItems(workMap: WorkMap.Item[], reviewerWorkMap: WorkMap.Item[], taskOrdering: string[]) {
  const { t } = useTranslation();
  const { tasks, assigned, reviewing, paused, completed } = React.useMemo(() => {
    const tasks = workMap.filter((i) => i.type === "task");

    const workMapWithoutTasks = workMap.filter((i) => i.type !== "task");
    const reviewerWorkMapWithoutTasks = reviewerWorkMap.filter((i) => i.type !== "task");

    const assignedData = processPersonalItems(workMapWithoutTasks);
    const reviewerData = processPersonalItems(reviewerWorkMapWithoutTasks);

    return {
      tasks: sortPersonalTasks(
        tasks.map((t) => ({ ...t, children: [] })),
        taskOrdering,
      ),
      assigned: sortItemsByDueDate(assignedData.ongoingItems),
      reviewing: sortItemsByDueDate(reviewerData.ongoingItems),
      paused: sortItemsByDueDate([...assignedData.pausedItems, ...reviewerData.pausedItems]),
      completed: sortItemsByClosedDate([...assignedData.completedItems, ...reviewerData.completedItems]),
    };
  }, [workMap, reviewerWorkMap, taskOrdering]);

  const tabs = useTabs("tasks", [
    { id: "tasks", testId: "tasks", label: t("Tasks"), icon: <IconChecklist size={14} />, count: tasks.length },
    {
      id: "assigned",
      testId: "assigned",
      label: t("Assigned"),
      icon: <IconClipboardCheck size={14} />,
      count: assigned.length,
    },
    {
      id: "reviewing",
      testId: "reviewing",
      label: t("Reviewing"),
      icon: <IconEye size={14} />,
      count: reviewing.length,
    },
    { id: "paused", testId: "paused", label: t("Paused"), icon: <IconPlayerPause size={14} />, count: paused.length },
    {
      id: "completed",
      testId: "completed",
      label: t("Completed"),
      icon: <IconCircleCheck size={14} />,
      count: completed.length,
    },
    { id: "activity", testId: "activity", label: t("Activity"), icon: <IconLogs size={14} /> },
    { id: "about", testId: "about", label: t("About"), icon: <IconUserCircle size={14} /> },
  ]);

  return {
    tabs,
    items: { tasks, assigned, reviewing, paused, completed },
  };
}

function ActivityFeed(props: ProfilePage.Props) {
  const { t } = useTranslation();
  return (
    <div className="p-4 max-w-5xl mx-auto my-6">
      <div className="font-bold text-lg mb-4">{t("Recent activity")}</div>
      {props.activityFeed}
    </div>
  );
}

function About(props: ProfilePage.Props) {
  const showAboutMe = !isContentEmpty(props.aboutMe);

  return (
    <div className="p-4 max-w-5xl mx-auto my-6">
      <div className="flex flex-col gap-y-6">
        {showAboutMe && (
          <AboutMe
            taskList={props.taskList}
            content={props.aboutMe}
            mentionedPersonLookup={props.mentionedPersonLookup}
          />
        )}
        <Contact person={props.person} />
        <Colleagues {...props} />
      </div>
    </div>
  );
}
