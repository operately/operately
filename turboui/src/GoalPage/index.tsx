import React from "react";
import type { GoalTargetList } from "../GoalTargetList";
import type { MiniWorkMap } from "../MiniWorkMap";

import { Link } from "../Link";
import { Page } from "../Page";

import { IconCircleCheck, IconTrash } from "@tabler/icons-react";
import { WarningCallout } from "../Callouts";
import { PageBanner } from "../PageBanner";
import { BadgeStatus } from "../StatusBadge/types";
import { isOverdue, Timeframe } from "../utils/timeframes";
import { WorkMapTab } from "../WorkMap/components/WorkMapTab";
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
    author: {
      id: string;
      fullName: string;
      avatarUrl: string | null;
    };
    date: Date;
    content: string;
    link: string;
  }
}

export function GoalPage(props: GoalPage.Props) {
  const navigation = [
    { to: props.spaceLink, label: "Acme" },
    { to: props.spaceLink, label: props.spaceName },
    { to: props.workmapLink, label: props.goalName },
  ];

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

  return (
    <Page title={[props.goalName]} navigation={navigation} options={options} size="fullwidth">
      <Tabs activeTab="overview" />
      <div className="max-w-5xl mx-auto mt-8">
        {props.closedOn && <ClosedBanner {...props} />}

        <div className="p-4">
          <PageHeader {...props} />

          <div className="sm:grid sm:grid-cols-10 sm:gap-8 my-8">
            <MainContent {...props} />
            <Sidebar {...props} />
          </div>
        </div>
      </div>
    </Page>
  );
}

export function Tabs({ activeTab, setTab, tabOptions = {} }: Props) {
  return (
    <div className="overflow-x-auto bg-zinc-50 border-b border-stroke-base">
      <div className="">
        <div className="px-2.5">
          <nav className="flex justify-between items-center overflow-x-auto" aria-label="Work Map Tabs">
            <div className="flex space-x-4">
              <WorkMapTab
                label="Overview"
                tab="overview"
                isActive={activeTab === "overview"}
                testId="work-map-tab-all"
                hide={tabOptions.hideAll}
                setTab={setTab}
              />
              <WorkMapTab
                label="Check-Ins"
                tab="convo"
                isActive={activeTab === "goals"}
                testId="work-map-tab-goals"
                hide={tabOptions.hideGoals}
                setTab={setTab}
              />
            </div>
          </nav>
        </div>
      </div>
    </div>
  );
}

function MainContent(props: GoalPage.Props) {
  return (
    <div className="space-y-8 sm:col-span-7 sm:pr-4">
      <Warnings {...props} />
      <Description {...props} />
      <Targets {...props} />
      <CheckIns {...props} />
      <RelatedWork {...props} />
      <Contributors {...props} />
    </div>
  );
}

function ActivityFooter({ activityFeed }: { activityFeed: React.ReactNode }) {
  return (
    <div className="mt-20">
      <h3 className="text-xs uppercase font-medium tracking-wider mb-2">Activity</h3>
      {activityFeed}
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
