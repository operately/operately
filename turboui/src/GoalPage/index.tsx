import React from "react";
import type { GoalTargetList } from "../GoalTargetList";
import type { MiniWorkMap } from "../MiniWorkMap";

import { Link } from "../Link";
import { PageNew } from "../Page";

import { IconCircleCheck, IconClipboardText, IconLogs, IconMessage, IconTrash } from "@tabler/icons-react";
import { WarningCallout } from "../Callouts";
import { PageBanner } from "../PageBanner";
import { MentionedPersonLookupFn } from "../RichEditor";
import { BadgeStatus } from "../StatusBadge/types";
import { Tabs, useTabs } from "../Tabs";
import { isOverdue, Timeframe } from "../utils/timeframes";
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
    mentionedPersonLookup: MentionedPersonLookupFn;

    parentGoal: ParentGoal | null;
    goalName: string;
    description?: string;
    spaceName: string;
    champion: Person | null;
    reviewer: Person | null;
    contributors: Contributor[];

    timeframe: Timeframe;
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

    updateTimeframe: (timeframe: Timeframe) => Promise<void>;

    activityFeed: React.ReactNode;
  }

  export interface CheckIn {
    id: string;
    author: Person;
    date: Date;
    content: string;
    link: string;
    commentCount: number;
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
    { id: "activity", label: "Activity Feed", icon: <IconLogs size={14} /> },
  ]);

  return (
    <PageNew title={[props.goalName]} options={options} size="fullwidth">
      <PageHeader {...props} />
      <Tabs tabs={tabs} />
      {props.closedOn && <ClosedBanner {...props} />}

      <div className="flex-1 overflow-scroll">
        {tabs.active === "overview" && <Overview {...props} />}
        {tabs.active === "check-ins" && <CheckIns {...props} />}
        {tabs.active === "activity" && <ActivityFeed {...props} />}
      </div>
    </PageNew>
  );
}

function ActivityFeed(props: GoalPage.Props) {
  return (
    <div className="p-4 max-w-5xl mx-auto my-6">
      <div className="font-bold text-lg mb-4">Activity Feed</div>
      {props.activityFeed}
    </div>
  );
}

function Overview(props: GoalPage.Props) {
  return (
    <div className="p-4 max-w-5xl mx-auto my-6">
      <div className="sm:grid sm:grid-cols-10 sm:gap-8">
        <MainContent {...props} />
        <Sidebar {...props} />
      </div>
    </div>
  );
}

function MainContent(props: GoalPage.Props) {
  return (
    <div className="space-y-12 sm:col-span-7 sm:pr-4">
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
  if (isOverdue(props.timeframe)) {
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
        description={<div>This goal is overdue. Close it or update the timeline.</div>}
      />
    );
  } else {
    return (
      <WarningCallout
        message="Overdue goal"
        description={
          <div>
            This goal is overdue. The information may be outdated. Please ping the champion to check-in or update the
            timeline.
          </div>
        }
      />
    );
  }
}
