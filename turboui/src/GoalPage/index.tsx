import React from "react";

import { Page } from "../Page";
import { Link } from "../Link";
import { Avatar } from "../Avatar";
import { PageFooter } from "../Page/PageFooter";
import { MiniWorkMap } from "../MiniWorkMap";
import { GoalTargetList } from "../GoalTargetList";
import { formatDateWithDaySuffix } from "../utils/date";
import { truncate } from "../utils/strings";
import { Sidebar } from "./Sidebar";

export namespace GoalPage {
  interface Person {
    id: string;
    fullName: string;
    avatarUrl: string;
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
    checkIns: CheckIn[];
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
    <Page title={[props.goalName]} navigation={navigation} size="large">
      <div className="grid grid-cols-10 gap-8 p-8">
        <MainContent {...props} />
        <Sidebar {...props} />
      </div>

      <ActivityFooter />
    </Page>
  );
}

function MainContent(props: GoalPage.Props) {
  return (
    <div className="col-span-7 space-y-8">
      <TitleAndDescription {...props} />

      <div>
        <h2 className="text-lg font-semibold mb-4">Targets</h2>
        <GoalTargetList targets={props.targets} />
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4">Check Ins</h2>
        <CheckIns checkIns={props.checkIns} />
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-4">Related Work</h2>
        <MiniWorkMap items={props.relatedWorkItems} />
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
  
function TitleAndDescription(props: GoalPage.Props) {
  const [isExpanded, setIsExpanded] = React.useState(false);

  return <div>
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
}

function CheckIns({ checkIns }: { checkIns: GoalPage.CheckIn[]} ) {
  return (
    <div className="space-y-4">
      {checkIns.map((checkIn) => (
        <div key={checkIn.id} className="flex flex-row items-start gap-3">
          <Avatar person={checkIn.author} size={36} />
          <div className="flex-1">
            <div className="text-sm -mt-px">
              <Link to={checkIn.link} className="hover:underline font-semibold text-black">
                {formatDateWithDaySuffix(checkIn.date)}
              </Link>
              {" — "}{truncate(checkIn.content, 150)}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}