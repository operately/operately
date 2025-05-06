import { useForm } from "react-hook-form";
import { Page } from "../Page";
import { DangerButton, SecondaryButton } from "../Button";

namespace GoalDeletePage {
  export interface Props {
    goalName: string;
    spaceName: string;

    spaceLink: string;
    workmapLink: string;
    goalLink: string;

    onDelete: (name: string) => void;
    onCancel: () => void;
  }

  export interface FormValues {
    name: string;
  }
}

export function GoalDeletePage(props: GoalDeletePage.Props) {
  const {
    handleSubmit,
    formState: { isDirty, isValid },
  } = useForm<GoalDeletePage.FormValues>({
    mode: "onBlur",
    defaultValues: { name: props.goalName },
  });

  const navigation = [
    { to: props.spaceLink, label: props.spaceName },
    { to: props.workmapLink, label: "Goals" },
    { to: props.goalLink, label: props.goalName },
  ];

  const submit = (data: GoalDeletePage.FormValues) => {
    if (isDirty && isValid) {
      props.onDelete(data.name);
    }
  };

  return (
    <Page title={["Edit Goal"]} size="medium" navigation={navigation}>
      <div className="p-12 sm:px-24">
        <h1 className="text-2xl font-bold mb-6">Delete {props.goalName}</h1>

        <form className="space-y-6" onSubmit={handleSubmit(submit)}>
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
