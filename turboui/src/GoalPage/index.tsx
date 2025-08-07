import React from "react";
import type { Checklist } from "../Checklist";
import type { GoalTargetList } from "../GoalTargetList";
import type { MiniWorkMap } from "../MiniWorkMap";

import { PageNew } from "../Page";
import { IconClipboardText, IconLogs, IconMessage, IconMessages } from "../icons";

import { Message } from "../Conversations";
import { DateField } from "../DateField";
import { MoveModal } from "../Modal/MoveModal";
import { PrivacyField } from "../PrivacyField";
import { MentionedPersonLookupFn } from "../RichEditor";
import { SearchFn } from "../RichEditor/extensions/MentionPeople";
import { BadgeStatus } from "../StatusBadge/types";
import { Tabs, useTabs } from "../Tabs";
import { Activity } from "./Activity";
import { CheckIns } from "./CheckIns";
import { DeleteModal } from "./DeleteModal";
import { Discussions } from "./Discussions";
import { AiState, GoalConversations, useAiState } from "./GoalConversations";
import { Overview } from "./Overview";
import { PageHeader } from "./PageHeader";

export namespace GoalPage {
  export interface Space {
    id: string;
    name: string;
    link: string;
  }

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

  export interface ParentGoal {
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

  export type GetConversationMessagesFn = (params: { convoRequestId: string }) => Promise<Message[]>;
  export interface Ai {
    enabled: boolean;
    startNewReview: (params: { convoId: string }) => void;
    getConversationMessages: GetConversationMessagesFn;
  }

  export interface Props {
    workmapLink: string;
    closeLink: string;
    reopenLink: string;
    newCheckInLink: string;
    newDiscussionLink: string;
    addSubgoalLink: string;
    addSubprojectLink: string;

    goalName: string;
    setGoalName: (name: string) => void;
    description?: string;

    space: Space;
    setSpace: (space: Space) => void;
    spaceSearch: (params: { query: string }) => Promise<Space[]>;

    parentGoal: ParentGoal | null;
    setParentGoal: (goal: ParentGoal | null) => void;
    parentGoalSearch: (params: { query: string }) => Promise<ParentGoal[]>;

    champion: Person | null;
    setChampion: (person: Person | null) => void;

    reviewer: Person | null;
    setReviewer: (person: Person | null) => void;

    dueDate: DateField.ContextualDate | null;
    setDueDate: (date: DateField.ContextualDate | null) => void;
    startDate: DateField.ContextualDate | null;
    setStartDate: (date: DateField.ContextualDate | null) => void;

    contributors: Contributor[];
    targets: GoalTargetList.Target[];
    checklistItems: Checklist.ChecklistItem[];
    relatedWorkItems: MiniWorkMap.WorkItem[];
    checkIns: CheckIn[];
    discussions: Discussion[];
    status: BadgeStatus;
    state: "active" | "closed";

    closedAt: Date | null;
    retrospective: Retrospective | null;

    canEdit: boolean;
    accessLevels: PrivacyField.AccessLevels;
    setAccessLevels: (levels: PrivacyField.AccessLevels) => void;

    neglectedGoal: boolean;

    mentionedPersonLookup: MentionedPersonLookupFn;
    peopleSearch: SearchFn;
    championSearch: SearchFn;
    reviewerSearch: SearchFn;

    updateDescription: (description: string | null) => Promise<boolean>;

    addTarget: GoalTargetList.AddTargetFn;
    deleteTarget: GoalTargetList.DeleteTargetFn;
    updateTarget: GoalTargetList.UpdateTargetFn;
    updateTargetValue: GoalTargetList.UpdateTargetValueFn;
    updateTargetIndex: GoalTargetList.UpdateTargetIndexFn;

    addChecklistItem?: Checklist.AddChecklistItemFn;
    deleteChecklistItem?: Checklist.DeleteChecklistItemFn;
    updateChecklistItem?: Checklist.UpdateChecklistItemFn;
    toggleChecklistItem?: Checklist.ToggleChecklistItemFn;
    updateChecklistItemIndex?: Checklist.UpdateChecklistItemIndexFn;

    deleteGoal: () => Promise<void>;

    activityFeed: React.ReactNode;

    deleteModalOpen?: boolean;
    moveModealOpen?: boolean;

    ai: Ai;
  }

  export interface State extends Props {
    isDeleteModalOpen: boolean;
    openDeleteModal: () => void;
    closeDeleteModal: () => void;

    isMoveModalOpen: boolean;
    openMoveModal: () => void;
    closeMoveModal: () => void;

    onReviewGoal?: () => void;

    aiState: AiState;
  }
}

function useGoalPageState(props: GoalPage.Props): GoalPage.State {
  const aiState = useAiState(props);

  const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(props.deleteModalOpen || false);
  const [isMoveModalOpen, setIsMoveModalOpen] = React.useState(props.moveModealOpen || false);

  return {
    ...props,

    isDeleteModalOpen,
    openDeleteModal: () => setIsDeleteModalOpen(true),
    closeDeleteModal: () => setIsDeleteModalOpen(false),

    isMoveModalOpen,
    openMoveModal: () => setIsMoveModalOpen(true),
    closeMoveModal: () => setIsMoveModalOpen(false),
    aiState,
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
    <>
      <PageNew title={[state.goalName]} size="fullwidth" testId="goal-page">
        <PageHeader {...state} />
        <Tabs tabs={tabs} />

        <div className="flex-1 overflow-scroll">
          {tabs.active === "overview" && <Overview {...state} />}
          {tabs.active === "check-ins" && <CheckIns {...state} />}
          {tabs.active === "discussions" && <Discussions {...state} />}
          {tabs.active === "activity" && <Activity {...state} />}
        </div>

        <DeleteModal {...state} />
        <MoveModal {...state} />
      </PageNew>

      <GoalConversations {...state} />
    </>
  );
}
