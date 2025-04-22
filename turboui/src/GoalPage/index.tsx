import type { MiniWorkMap } from "../MiniWorkMap";
import type { GoalTargetList } from "../GoalTargetList";

import { Page } from "../Page";
import { PageHeader } from "./PageHeader";
import { PageFooter } from "../Page/PageFooter";
import { Sidebar } from "./Sidebar";
import { Messages } from "./Messages";
import { CheckIns } from "./CheckIns";
import { Targets } from "./Targets";
import { Description } from "./Description";
import { RelatedWork } from "./RelatedWork";

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
    { to: props.workmapLink, label: "Goals" },
  ];

  return (
    <Page title={[props.goalName]} navigation={navigation} size="xlarge">
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
      <Description {...props} />
      <Targets {...props} />
      <CheckIns {...props} />
      <Messages {...props} />
      <RelatedWork {...props} />
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
