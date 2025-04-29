import type { MiniWorkMap } from "../MiniWorkMap";
import type { GoalTargetList } from "../GoalTargetList";

import { Link } from "../Link";
import { Page } from "../Page";
import { PageFooter } from "../Page/PageFooter";

import { PageBanner } from "../PageBanner";
import { PageHeader } from "./PageHeader";
import { Sidebar } from "./Sidebar";
import { Messages } from "./Messages";
import { CheckIns } from "./CheckIns";
import { Targets } from "./Targets";
import { Description } from "./Description";
import { RelatedWork } from "./RelatedWork";
import { BadgeStatus } from "../StatusBadge/types";
import { Contributors } from "./Contributors";
import { WarningCallout } from "../Callouts";

export namespace GoalPage {
  interface Person {
    id: string;
    fullName: string;
    avatarUrl: string;
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

    parentGoal: ParentGoal | null;
    goalName: string;
    description?: string;
    spaceName: string;
    champion?: Person;
    reviewer?: Person;
    contributors: Contributor[];

    targets: GoalTargetList.Target[];
    relatedWorkItems: MiniWorkMap.WorkItem[];
    startDate: Date;
    endDate: Date;
    checkIns: CheckIn[];
    messages: Message[];
    status: BadgeStatus;

    closedOn?: Date;
    retrospectiveLink?: string;

    canEdit: boolean;
    privacyLevel: "public" | "internal" | "confidential" | "secret";

    neglectedGoal?: boolean;
  }

  export interface CheckIn {
    id: string;
    author: {
      id: string;
      fullName: string;
      avatarUrl: string;
    };
    date: Date;
    content: string;
    link: string;
  }
}

export function GoalPage(props: GoalPage.Props) {
  const navigation = [
    { to: props.spaceLink, label: props.spaceName },
    { to: props.workmapLink, label: "Goals" },
  ];

  return (
    <Page title={[props.goalName]} navigation={navigation} size="xlarge">
      {props.closedOn && <ClosedBanner {...props} />}

      <div className="p-4 sm:px-24">
        <PageHeader {...props} />

        <div className="sm:grid sm:grid-cols-10 sm:gap-8 my-8">
          <MainContent {...props} />
          <Sidebar {...props} />
        </div>
      </div>

      <ActivityFooter />
    </Page>
  );
}

function MainContent(props: GoalPage.Props) {
  return (
    <div className="space-y-8 sm:col-span-7 sm:pr-4">
      <NeglectedGoalWarning {...props} />
      <Description {...props} />
      <Targets {...props} />
      <CheckIns {...props} />
      <Messages {...props} />
      <RelatedWork {...props} />
      <Contributors {...props} />
    </div>
  );
}

function ActivityFooter() {
  return (
    <PageFooter className="p-8">
      <h3 className="text-xs uppercase font-medium tracking-wider">Activity</h3>
    </PageFooter>
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

function NeglectedGoalWarning(props: GoalPage.Props) {
  if (!props.neglectedGoal) return null;

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
