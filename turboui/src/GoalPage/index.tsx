import { Page } from "../Page";

export namespace GoalPage {
  export interface Props {
    spaceLink: string;
    workmapLink: string;

    goalName: string;
    spaceName: string;
  }
}

export function GoalPage(props: GoalPage.Props) {
  const navigation = [
    { to: props.spaceLink, label: props.spaceName },
    { to: props.workmapLink, label: "Workmap" },
  ];

  return (
    <Page title={[props.goalName]} navigation={navigation} size="large">
      <div className="p-8">
        <h1 className="text-2xl font-bold text-gray-900">{props.goalName}</h1>
      </div>
    </Page>
  );
}
