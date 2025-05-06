import { useForm } from "react-hook-form";
import { Page } from "../Page";
import { DangerButton, SecondaryButton } from "../Button";
import { WarningCallout } from "../Callouts";

namespace GoalDeletePage {
  export interface Props {
    goalId: string;
    goalName: string;
    spaceName: string;

    spaceLink: string;
    workmapLink: string;
    goalLink: string;

    onSubmit: (id: string) => void;
    onCancel: () => void;
  }

  export interface FormValues {
    name: string;
  }
}

export function GoalDeletePage(props: GoalDeletePage.Props) {
  const navigation = [
    { to: props.spaceLink, label: props.spaceName },
    { to: props.workmapLink, label: "Goals" },
    { to: props.goalLink, label: props.goalName },
  ];

  return (
    <Page title={["Edit Goal"]} size="medium" navigation={navigation}>
      <div className="p-12 sm:px-24">
        <h1 className="text-2xl font-bold mb-6">Delete {props.goalName}</h1>

        <form className="space-y-6" onSubmit={() => props.onSubmit(props.goalId)}>
          <WarningCallout
            message="This action cannot be undone"
            description={`Deleting a goal is permanent and cannot be undone. Please confirm that you want to delete the ${props.goalName} goal.`}
          />

          <div className="flex items-center gap-2">
            <DangerButton size="sm" type="submit">
              Delete Forever
            </DangerButton>
            <SecondaryButton size="sm" onClick={props.onCancel}>
              Cancel
            </SecondaryButton>
          </div>
        </form>
      </div>
    </Page>
  );
}
