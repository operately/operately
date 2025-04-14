import { Page } from "../Page";
import { PageFooter } from "../Page/PageFooter";
import { MiniWorkMap } from "../MiniWorkMap";
import { AvatarWithName } from "../Avatar";

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

    relatedWorkItems: MiniWorkMap.WorkItem[];
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
        <RelatedWork {...props} />
        <Sidebar {...props} />
      </div>

      <ActivityFooter />
    </Page>
  );
}

function Sidebar(props: GoalPage.Props) {
  return (
    <div className="col-span-3 space-y-6">
      <Champion {...props} />
      <Reviewer {...props} />
    </div>
  );
}

function Champion(props: GoalPage.Props) {
  if (!props.champion) return null;

  return (
    <div className="mb-4">
      <div className="text-xs uppercase font-medium mb-2 tracking-wider">
        Champion
      </div>
      <AvatarWithName
        person={props.champion}
        size={24}
        className="text-sm text-gray-900"
      />
    </div>
  );
}

function Reviewer(props: GoalPage.Props) {
  if (!props.reviewer) return null;

  return (
    <div>
      <div className="text-xs uppercase font-medium mb-2 tracking-wider">
        Reviewer
      </div>
      <AvatarWithName
        person={props.reviewer}
        size={24}
        className="text-sm text-gray-900"
      />
    </div>
  );
}

function RelatedWork(props: GoalPage.Props) {
  return (
    <div className="col-span-7 space-y-8">
      <h1 className="text-2xl font-bold">{props.goalName}</h1>

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
