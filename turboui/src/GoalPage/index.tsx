import { Page } from "../Page";
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

  export interface Props {
    spaceLink: string;
    workmapLink: string;

    goalName: string;
    spaceName: string;
    champion?: Person;
    reviewer?: Person;
    contributors?: Person[];

    targets: GoalTargetList.Target[];
    relatedWorkItems: MiniWorkMap.WorkItem[];
    startDate: Date;
    endDate: Date;
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
  return (
    <div className="col-span-7 space-y-8">
      <h1 className="text-2xl font-bold">{props.goalName}</h1>

      <div>
        <h2 className="text-lg font-semibold mb-4">Targets</h2>
        <GoalTargetList targets={props.targets} />
      </div>

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
