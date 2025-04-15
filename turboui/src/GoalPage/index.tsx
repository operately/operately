import { Page } from "../Page";
import React from "react";
import { PageFooter } from "../Page/PageFooter";
import { MiniWorkMap } from "../MiniWorkMap";
import { AvatarWithName, AvatarList } from "../Avatar";
import { GoalTargetList } from "../GoalTargetList";
import { Chronometer } from "../Chronometer";

export namespace GoalPage {
  interface Person {
    id: string;
    fullName: string;
    avatarUrl: string;
  }

  interface CheckIn {
    submitter: Person;
    link: string;
    status: "on_track" | "at_risk" | "off_track";
    nextCheckIn: string;
    message: string;
  }

  export interface Props {
    spaceLink: string;
    workmapLink: string;

    goalName: string;
    description?: string;
    spaceName: string;
    champion?: Person;
    reviewer?: Person;
    contributors?: Person[];

    targets: GoalTargetList.Target[];
    relatedWorkItems: MiniWorkMap.WorkItem[];
    startDate: Date;
    endDate: Date;
    lastCheckIn?: CheckIn;
  }
}

export function GoalPage(props: GoalPage.Props) {
  const navigation = [
    { to: props.spaceLink, label: props.spaceName },
    { to: props.workmapLink, label: "Workmap" },
  ];

  return (
    <Page title={[props.goalName]} navigation={navigation} size="large">
      <div className="grid grid-cols-10 gap-8 p-8">
        <MainContent {...props} />
        <Sidebar {...props} />
      </div>

      <ActivityFooter />
    </Page>
  );
}

function Sidebar(props: GoalPage.Props) {
  return (
    <div className="col-span-3 space-y-6">
      <Timeframe {...props} />
      <Champion {...props} />
      <Reviewer {...props} />
      <Contributors {...props} />
    </div>
  );
}

function Timeframe(props: GoalPage.Props) {
  return (
    <div>
      <div className="text-xs uppercase font-medium mb-2 tracking-wider">Timeline</div>
      <Chronometer start={props.startDate} end={props.endDate} color="stone" />
    </div>
  );
}

function Champion(props: GoalPage.Props) {
  if (!props.champion) return null;

  return (
    <div className="mb-4">
      <div className="text-xs uppercase font-medium mb-2 tracking-wider">Champion</div>
      <AvatarWithName person={props.champion} size={24} className="text-sm text-gray-900" />
    </div>
  );
}

function Reviewer(props: GoalPage.Props) {
  if (!props.reviewer) return null;

  return (
    <div>
      <div className="text-xs uppercase font-medium mb-2 tracking-wider">Reviewer</div>
      <AvatarWithName person={props.reviewer} size={24} className="text-sm text-gray-900" />
    </div>
  );
}

function MainContent(props: GoalPage.Props) {
  const [isExpanded, setIsExpanded] = React.useState(false);

  return (
    <div className="col-span-7 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">{props.goalName}</h1>

        {props.description && (
          <div className="">
            <div className="whitespace-pre-wrap">
              {isExpanded ? props.description : truncate(props.description, 300)}
            </div>
            {props.description.length > 300 && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-content-dimmed hover:underline text-sm mt-1 font-medium"
              >
                {isExpanded ? "Collapse" : "Expand"}
              </button>
            )}
          </div>
        )}
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4">Targets</h2>
        <GoalTargetList targets={props.targets} />
      </div>

      {props.lastCheckIn && (
        <div>
          <h2 className="text-lg font-semibold mb-4">Last Check-In</h2>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              <AvatarWithName person={props.lastCheckIn.submitter} size={24} className="text-sm" />
              <a href={props.lastCheckIn.link} className="text-blue-600 hover:underline text-sm">
                Check-in {new Date(props.lastCheckIn.nextCheckIn).toLocaleDateString()}
              </a>
            </div>
            <div className="flex items-center gap-2 mb-3">
              <div className="flex items-center gap-2">
                <div
                  className={`w-3 h-3 rounded-full ${
                    props.lastCheckIn.status === "on_track"
                      ? "bg-green-500"
                      : props.lastCheckIn.status === "at_risk"
                      ? "bg-yellow-500"
                      : "bg-red-500"
                  }`}
                />
                <span className="text-sm font-medium">
                  {props.lastCheckIn.status === "on_track"
                    ? "On Track"
                    : props.lastCheckIn.status === "at_risk"
                    ? "At Risk"
                    : "Off Track"}
                </span>
              </div>
              <span className="text-gray-400">•</span>
              <span className="text-sm text-gray-600">
                Next check-in scheduled for {new Date(props.lastCheckIn.nextCheckIn).toLocaleDateString()}
              </span>
            </div>
            <p className="text-sm text-gray-700">{props.lastCheckIn.message}</p>
          </div>
        </div>
      )}

      <div>
        <h2 className="text-lg font-semibold mb-4">Related Work</h2>
        <MiniWorkMap items={props.relatedWorkItems} />
      </div>
    </div>
  );
}

function Contributors(props: GoalPage.Props) {
  if (!props.contributors || props.contributors.length === 0) return null;

  return (
    <div>
      <div className="text-xs uppercase font-medium mb-2 tracking-wider">Contributors</div>
      <div className="mb-2">
        <AvatarList people={props.contributors} size={24} maxElements={30} />
      </div>
      <div className="text-xs text-gray-600">
        {props.contributors.length} {props.contributors.length === 1 ? "person" : "people"} contributed by working on
        related projects and sub-goals
      </div>
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

function truncate(text: string, maxLength: number) {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
}
