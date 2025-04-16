import React from "react";

import { Page } from "../Page";
import { BlackLink, Link } from "../Link";
import { Avatar } from "../Avatar";
import { PageFooter } from "../Page/PageFooter";
import { MiniWorkMap } from "../MiniWorkMap";
import { GoalTargetList } from "../GoalTargetList";
import { formatDateWithDaySuffix } from "../utils/date";
import { truncate } from "../utils/strings";
import { Sidebar } from "./Sidebar";
import { PrimaryButton, SecondaryButton } from "../Button";
import { IconStar } from "@tabler/icons-react";

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
    role: string;
  }

  export interface Props {
    spaceLink: string;
    workmapLink: string;

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

    /**
     * Whether the current user can edit the goal and its content.
     */
    canEdit: boolean;
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
    { to: props.workmapLink, label: "Workmap" },
  ];

  return (
    <Page title={[props.goalName]} navigation={navigation} size="xlarge">
      <div className="px-24">
        <Header {...props} />

        <div className="grid grid-cols-10 gap-8 my-8">
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
    <div className="col-span-7 space-y-8">
      <Description {...props} />
      <Targets {...props} />
      <CheckIns {...props} />
      <Messages {...props} />
      <RelatedWork {...props} />
    </div>
  );
}

function Messages(props: GoalPage.Props) {
  if (props.messages.length === 0) {
    return (
      <div>
        <h2 className="font-bold mb-1">Messages</h2>
        <div className="text-content-dimmed text-sm">
          {props.canEdit
            ? "Share announcements, decisions, and important information with your team."
            : "Announcements, decisions, and important information will be shared here."}
        </div>

        {props.canEdit && (
          <div className="mt-2">
            <SecondaryButton size="xs">Write message</SecondaryButton>
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <h2 className="font-bold mb-4">Messages</h2>
      <div className="space-y-4">
        {props.messages.map((message) => (
          <div key={message.id} className="flex flex-row items-start gap-3">
            <Avatar person={message.author} size={36} />
            <div className="flex-1">
              <div className="text-sm -mt-px">
                <Link to={message.link} className="hover:underline font-semibold">
                  {message.title}
                </Link>
                {" — "}
                {truncate(message.content, 150)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CheckIns(props: GoalPage.Props) {
  if (props.checkIns.length === 0) return null;

  return (
    <div>
      <h2 className="font-bold mb-4">Check-Ins</h2>

      <div className="space-y-4">
        {props.checkIns.map((checkIn) => (
          <div key={checkIn.id} className="flex flex-row items-start gap-3">
            <Avatar person={checkIn.author} size={36} />
            <div className="flex-1">
              <div className="text-sm -mt-px">
                <Link to={checkIn.link} className="hover:underline font-semibold">
                  {formatDateWithDaySuffix(checkIn.date)}
                </Link>
                {" — "}
                {truncate(checkIn.content, 150)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Targets(props: GoalPage.Props) {
  if (props.targets.length === 0) {
    return (
      <div>
        <h2 className="font-bold mb-1">Targets</h2>
        <div className="text-content-dimmed text-sm">
          {props.canEdit
            ? "Add targets to measure progress and celebrate wins."
            : "The champion didn't yet set targets for this goal."}
        </div>

        {props.canEdit && (
          <div className="mt-2">
            <SecondaryButton size="xs">Add first target</SecondaryButton>
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <h2 className="font-bold mb-4">Targets</h2>
      <GoalTargetList targets={props.targets} />
    </div>
  );
}

function RelatedWork(props: GoalPage.Props) {
  if (props.relatedWorkItems.length === 0) {
    return (
      <div>
        <h2 className="font-bold mb-1">Related Work</h2>
        <div className="text-content-dimmed text-sm">
          {props.canEdit
            ? "Break down the work on this goal into subgoals and projects."
            : "Connections to supporting projects and subgoals will appear here."}
        </div>

        {props.canEdit && (
          <div className="mt-2 flex items-center gap-2">
            <SecondaryButton size="xs">Add subgoal</SecondaryButton>
            <SecondaryButton size="xs">Add project</SecondaryButton>
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <h2 className="font-bold mb-4">Related Work</h2>
      <MiniWorkMap items={props.relatedWorkItems} />
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

function Header(props: GoalPage.Props) {
  return (
    <div className="border-b border-stroke-base pt-12 pb-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{props.goalName}</h1>

        <div className="flex items-center gap-2">
          <SecondaryButton size="sm">
            <IconStar size="16" />
          </SecondaryButton>

          <SecondaryButton size="sm">Edit</SecondaryButton>
          <PrimaryButton size="sm">Check-In</PrimaryButton>
        </div>
      </div>
    </div>
  );
}

function Description(props: GoalPage.Props) {
  const [isExpanded, setIsExpanded] = React.useState(false);

  if (!props.description) {
    if (props.canEdit) {
      return (
        <div>
          <h2 className="font-bold mb-1">Description</h2>
          <div className="text-content-dimmed text-sm">Describe the goal to provide context and clarity.</div>

          {props.canEdit && (
            <div className="mt-2 flex items-center gap-2">
              <SecondaryButton size="xs">Write overview</SecondaryButton>
            </div>
          )}
        </div>
      );
    } else {
      return null;
    }
  }

  return (
    <div>
      <h2 className="font-bold mb-2">Description</h2>

      <div className="">
        <div className="whitespace-pre-wrap">{isExpanded ? props.description : truncate(props.description, 200)}</div>
        {props.description.length > 200 && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-content-dimmed hover:underline text-sm mt-1 font-medium"
          >
            {isExpanded ? "Collapse" : "Expand"}
          </button>
        )}
      </div>
    </div>
  );
}
