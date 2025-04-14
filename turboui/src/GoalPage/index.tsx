import { Page } from "../Page";
import { MiniWorkMap } from "../MiniWorkMap";

export namespace GoalPage {
  export interface Props {
    spaceLink: string;
    workmapLink: string;

    goalName: string;
    spaceName: string;
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
      <div className="p-8 space-y-8">
        <h1 className="text-2xl font-bold text-gray-900">{props.goalName}</h1>
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Related Work
          </h2>
          <MiniWorkMap items={props.relatedWorkItems} />
        </div>
      </div>
    </Page>
  );
}
