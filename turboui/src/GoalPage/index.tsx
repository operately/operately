import React from "react";
import type { GoalTargetList } from "../GoalTargetList";
import type { MiniWorkMap } from "../MiniWorkMap";

import { PageNew } from "../Page";

import { IconClipboardText, IconLogs, IconMessage, IconMessages } from "@tabler/icons-react";

import { GoalField } from "../GoalField";
import { MentionedPersonLookupFn } from "../RichEditor";
import { SearchFn } from "../RichEditor/extensions/MentionPeople";
import { BadgeStatus } from "../StatusBadge/types";
import { Tabs, useTabs } from "../Tabs";
import { Activity } from "./Activity";
import { CheckIns } from "./CheckIns";
import { DeleteModal } from "./DeleteModal";
import { Discussions } from "./Discussions";
import { Overview } from "./Overview";
import { PageHeader } from "./PageHeader";
import { pageOptions } from "./PageOptions";

export namespace GoalPage {
  export interface Retrospective {
    link: string;
    content: string;
    date: Date;
    author: Person;
  }

  export interface Person {
    id: string;
    fullName: string;
    avatarUrl: string | null;
    title: string;
    profileLink: string;
  }

  export interface Contributor {
    person: Person;
    personLink: string;

    contributions: {
      role: string;
      location: string;
      link: string;
    }[];
  }

  interface ParentGoal {
    id: string;
    name: string;
    link: string;
  }

  export interface CheckIn {
    id: string;
    author: Person;
    date: Date;
    content: string;
    link: string;
    commentCount: number;
    status: BadgeStatus;
  }

  export interface Discussion {
    id: string;
    title: string;
    author: Person;
    date: Date;
    link: string;
    content: string;
    commentCount: number;
  }

  export interface Props {
    spaceLink: string;
    workmapLink: string;
    closeLink: string;
    editGoalLink: string;
    newCheckInLink: string;
    newDiscussionLink: string;
    addSubgoalLink: string;
    addSubprojectLink: string;

    goalName: string;
    description?: string;
    spaceName: string;

    parentGoal: ParentGoal | null;
    setParentGoal: (goal: ParentGoal | null) => void;
    searchParentGoals: GoalField.SearchGoalFn;

    champion: Person | null;
    setChampion: (person: Person | null) => void;

    reviewer: Person | null;
    setReviewer: (person: Person | null) => void;

    dueDate: Date | null;
    setDueDate: (date: Date | null) => void;

    contributors: Contributor[];
    targets: GoalTargetList.Target[];
    relatedWorkItems: MiniWorkMap.WorkItem[];
    checkIns: CheckIn[];
    discussions: Discussion[];
    status: BadgeStatus;
    state: "active" | "closed";

    closedAt: Date | null;
    retrospective: Retrospective | null;

    canEdit: boolean;
    privacyLevel: "public" | "internal" | "confidential" | "secret";
    neglectedGoal: boolean;

    mentionedPersonLookup: MentionedPersonLookupFn;
    peopleSearch: SearchFn;
    championSearch: SearchFn;
    reviewerSearch: SearchFn;

    updateGoalName: (name: string) => Promise<boolean>;
    updateDescription: (description: string | null) => Promise<boolean>;

    addTarget: GoalTargetList.AddTargetFn;
    deleteTarget: GoalTargetList.DeleteTargetFn;
    updateTarget: GoalTargetList.UpdateTargetFn;
    updateTargetValue: GoalTargetList.UpdateTargetValueFn;
    updateTargetIndex: GoalTargetList.UpdateTargetIndexFn;
    deleteGoal: () => Promise<void>;

    activityFeed: React.ReactNode;

    deleteModalOpen?: boolean;
  }

  export interface State extends Props {
    isDeleteModalOpen: boolean;
    openDeleteModal: () => void;
    closeDeleteModal: () => void;
  }
}

function useGoalPageState(props: GoalPage.Props): GoalPage.State {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(props.deleteModalOpen || false);

  return {
    ...props,

    isDeleteModalOpen,
    openDeleteModal: () => setIsDeleteModalOpen(true),
    closeDeleteModal: () => setIsDeleteModalOpen(false),
  };
}

export function GoalPage(props: GoalPage.Props) {
  const state = useGoalPageState(props);

  const tabs = useTabs("overview", [
    { id: "overview", label: "Overview", icon: <IconClipboardText size={14} /> },
    { id: "check-ins", label: "Check-Ins", icon: <IconMessage size={14} />, count: props.checkIns.length },
    { id: "discussions", label: "Discussions", icon: <IconMessages size={14} />, count: props.discussions.length },
    { id: "activity", label: "Activity", icon: <IconLogs size={14} /> },
  ]);

  return (
    <PageNew title={[state.goalName]} options={pageOptions(state)} size="fullwidth">
      <PageHeader {...state} />
      <Tabs tabs={tabs} />

      <div className="flex-1 overflow-scroll">
        {tabs.active === "overview" && <Overview {...state} />}
        {tabs.active === "check-ins" && <CheckIns {...state} />}
        {tabs.active === "discussions" && <Discussions {...state} />}
        {tabs.active === "activity" && <Activity {...state} />}
      </div>

      <DeleteModal {...state} />
    </PageNew>
  );
}
