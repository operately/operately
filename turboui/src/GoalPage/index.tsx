import React from "react";
import type { GoalTargetList } from "../GoalTargetList";
import type { MiniWorkMap } from "../MiniWorkMap";

import { PageNew } from "../Page";

import {
  IconCircleCheck,
  IconClipboardText,
  IconLogs,
  IconMessage,
  IconMessages,
  IconTrash,
} from "@tabler/icons-react";

import { WarningCallout } from "../Callouts";
import { MentionedPersonLookupFn } from "../RichEditor";
import { SearchFn } from "../RichEditor/extensions/MentionPeople";
import { BadgeStatus } from "../StatusBadge/types";
import { Tabs, useTabs } from "../Tabs";
import { isOverdue } from "../utils/time";
import { CheckIns } from "./CheckIns";
import { Contributors } from "./Contributors";
import { DeleteModal } from "./DeleteModal";
import { Description } from "./Description";
import { Discussions } from "./Discussions";
import { PageHeader } from "./PageHeader";
import { RelatedWork } from "./RelatedWork";
import { Sidebar } from "./Sidebar";
import { Targets } from "./Targets";

export namespace GoalPage {
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

    parentGoal: ParentGoal | null;
    goalName: string;
    description?: string;
    spaceName: string;

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
    retrospectiveLink?: string;

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
    closeDeleteModal: () => void;
  }
}

export function GoalPage(props: GoalPage.Props) {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(props.deleteModalOpen || false);

  const state = React.useMemo<GoalPage.State>(
    () => ({
      ...props,
      isDeleteModalOpen,
      closeDeleteModal: () => setIsDeleteModalOpen(false),
    }),
    [props, isDeleteModalOpen],
  );

  const options = [
    {
      type: "link" as const,
      label: "Close",
      link: props.closeLink,
      icon: IconCircleCheck,
      hidden: !props.canEdit || props.state === "closed",
    },
    {
      type: "action" as const,
      label: "Delete",
      onClick: () => setIsDeleteModalOpen(true),
      icon: IconTrash,
      hidden: !props.canEdit,
    },
  ];

  const tabs = useTabs("overview", [
    { id: "overview", label: "Overview", icon: <IconClipboardText size={14} /> },
    { id: "check-ins", label: "Check-Ins", icon: <IconMessage size={14} />, count: props.checkIns.length },
    { id: "discussions", label: "Discussions", icon: <IconMessages size={14} />, count: props.discussions.length },
    { id: "activity", label: "Activity", icon: <IconLogs size={14} /> },
  ]);

  return (
    <PageNew title={[state.goalName]} options={options} size="fullwidth">
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

function Activity(props: GoalPage.State) {
  return (
    <div className="p-4 max-w-5xl mx-auto my-6">
      <div className="font-bold text-lg mb-4">Activity</div>
      {props.activityFeed}
    </div>
  );
}

function Overview(props: GoalPage.State) {
  return (
    <div className="p-4 max-w-6xl mx-auto my-6">
      <div className="sm:grid sm:grid-cols-12">
        <MainContent {...props} />
        <Sidebar {...props} />
      </div>
    </div>
  );
}

function MainContent(props: GoalPage.State) {
  return (
    <div className="space-y-12 sm:col-span-8 sm:pr-8">
      <Warnings {...props} />
      <Description {...props} />
      <Targets {...props} />
      <RelatedWork {...props} />
      <Contributors {...props} />
    </div>
  );
}

function Warnings(props: GoalPage.State) {
  if (props.state == "closed") return null;

  if (props.dueDate && isOverdue(props.dueDate)) {
    return <OverdueWarning {...props} />;
  }

  if (props.neglectedGoal) {
    return <NeglectedGoalWarning {...props} />;
  }

  return null;
}

function NeglectedGoalWarning(props: GoalPage.State) {
  if (props.canEdit) {
    return (
      <WarningCallout
        message="Outdated goal"
        description={<div>The last check-in was more than a month ago. Please check-in or close the goal.</div>}
      />
    );
  } else {
    return (
      <WarningCallout
        message="Outdated goal"
        description={
          <div>
            The last check-in was more than a month ago. The information may be outdated. Please ping the champion
            check-in or close the goal.
          </div>
        }
      />
    );
  }
}

function OverdueWarning(props: GoalPage.State) {
  if (props.canEdit) {
    return (
      <WarningCallout
        message="Overdue goal"
        description={<div>This goal is overdue. Close it or update the due date.</div>}
      />
    );
  } else {
    return (
      <WarningCallout
        message="Overdue goal"
        description={
          <div>
            This goal is overdue. The information may be outdated. Please ping the champion to check-in or update.
          </div>
        }
      />
    );
  }
}
