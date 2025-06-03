import React from "react";
import type { GoalTargetList } from "../GoalTargetList";
import type { MiniWorkMap } from "../MiniWorkMap";

import { Link } from "../Link";
import { PageNew } from "../Page";

import { IconCircleCheck, IconClipboardText, IconLogs, IconMessage, IconTrash } from "@tabler/icons-react";
import { WarningCallout } from "../Callouts";
import { PageBanner } from "../PageBanner";
import { MentionedPersonLookupFn } from "../RichEditor";
import { SearchFn } from "../RichEditor/extensions/MentionPeople";
import { BadgeStatus } from "../StatusBadge/types";
import { Tabs, useTabs } from "../Tabs";
import { isOverdue } from "../utils/time";
import { CheckIns } from "./CheckIns";
import { Contributors } from "./Contributors";
import { Description } from "./Description";
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

  export interface Message {
    id: string;
    title: string;
    author: Person;
    content: string;
    link: string;
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

  export interface Props {
    spaceLink: string;
    workmapLink: string;
    closeLink: string;
    deleteLink: string;
    editGoalLink: string;
    newCheckInLink: string;
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
    messages: Message[];
    status: BadgeStatus;

    closedOn?: Date;
    retrospectiveLink?: string;

    canEdit: boolean;
    privacyLevel: "public" | "internal" | "confidential" | "secret";

    neglectedGoal?: boolean;

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

    activityFeed: React.ReactNode;
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
}

export function GoalPage(props: GoalPage.Props) {
  const options = [
    {
      type: "link" as const,
      label: "Close",
      link: props.closeLink,
      icon: IconCircleCheck,
      hidden: !!props.closedOn || !props.canEdit,
    },
    {
      type: "link" as const,
      label: "Delete",
      link: props.deleteLink,
      icon: IconTrash,
      hidden: !props.canEdit,
    },
  ];

  const tabs = useTabs("overview", [
    { id: "overview", label: "Overview", icon: <IconClipboardText size={14} /> },
    { id: "check-ins", label: "Check-Ins", icon: <IconMessage size={14} />, count: props.checkIns.length },
    { id: "activity", label: "Activity", icon: <IconLogs size={14} /> },
  ]);

  return (
    <PageNew title={[props.goalName]} options={options} size="fullwidth">
      <PageHeader {...props} />
      <Tabs tabs={tabs} />
      {props.closedOn && <ClosedBanner {...props} />}

      <div className="flex-1 overflow-scroll">
        {tabs.active === "overview" && <Overview {...props} />}
        {tabs.active === "check-ins" && <CheckIns {...props} />}
        {tabs.active === "activity" && <Activity {...props} />}
      </div>
    </PageNew>
  );
}

function Activity(props: GoalPage.Props) {
  return (
    <div className="p-4 max-w-5xl mx-auto my-6">
      <div className="font-bold text-lg mb-4">Activity</div>
      {props.activityFeed}
    </div>
  );
}

function Overview(props: GoalPage.Props) {
  return (
    <div className="p-4 max-w-6xl mx-auto my-6">
      <div className="sm:grid sm:grid-cols-12">
        <MainContent {...props} />
        <Sidebar {...props} />
      </div>
    </div>
  );
}

function MainContent(props: GoalPage.Props) {
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

function ClosedBanner(props: GoalPage.Props) {
  return (
    <PageBanner>
      This goal was closed on{" "}
      {props.closedOn?.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "2-digit",
      })}
      . <Link to={props.retrospectiveLink!}>View Retrospective</Link>
    </PageBanner>
  );
}

function Warnings(props: GoalPage.Props) {
  if (props.dueDate && isOverdue(props.dueDate)) {
    return <OverdueWarning {...props} />;
  }

  if (props.neglectedGoal) {
    return <NeglectedGoalWarning {...props} />;
  }

  return null;
}

function NeglectedGoalWarning(props: GoalPage.Props) {
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

function OverdueWarning(props: GoalPage.Props) {
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
