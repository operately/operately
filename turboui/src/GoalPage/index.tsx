import { Page } from "../Page";
import { PageFooter } from "../Page/PageFooter";
import { MiniWorkMap } from "../MiniWorkMap";
import { GoalTargetList } from "../GoalTargetList";
import { Sidebar } from "./Sidebar";
import { PrimaryButton, SecondaryButton } from "../Button";
import { IconStar } from "@tabler/icons-react";
import { IconPencil } from "@tabler/icons-react";
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
    <div className="col-span-7 space-y-8">
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

function PageHeader(props: GoalPage.Props) {
  return (
    <div className="border-b border-stroke-base sm:pt-8 pb-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{props.goalName}</h1>

        <div className="flex items-center gap-2">
          <SecondaryButton size="sm">
            <div className="flex items-center gap-1.5">
              <IconStar size="16" /> Follow
            </div>
          </SecondaryButton>

          {props.canEdit && (
            <SecondaryButton size="sm">
              <div className="flex items-center gap-1.5">
                <IconPencil size="16" /> Edit
              </div>
            </SecondaryButton>
          )}
          {props.canEdit && <PrimaryButton size="sm">Check-In</PrimaryButton>}
        </div>
      </div>
    </div>
  );
}
