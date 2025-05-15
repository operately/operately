import React from "react";
import { useForm } from "react-hook-form";
import { Page } from "../Page";
import { PrimaryButton, SecondaryButton } from "../Button";

namespace GoalClosePage {
  export interface Props {
    goalName: string;
    spaceName: string;

    spaceLink: string;
    workmapLink: string;
    goalLink: string;

    onSave: (name: string) => void;
    onCancel: () => void;
  }

  export interface FormValues {
    name: string;
  }
}

export function GoalClosePage(props: GoalClosePage.Props) {
  const {
    handleSubmit,
    formState: { isDirty, isValid },
  } = useForm<GoalClosePage.FormValues>({
    mode: "onBlur",
    defaultValues: { name: props.goalName },
  });

  const navigation = [
    { to: props.spaceLink, label: props.spaceName },
    { to: props.workmapLink, label: "Goals" },
    { to: props.goalLink, label: props.goalName },
  ];

  const submit = (data: GoalClosePage.FormValues) => {
    if (isDirty && isValid) {
      props.onSave(data.name);
    }
  };

  return (
    <Page title={["Edit Goal"]} size="medium" navigation={navigation}>
      <div className="p-12 sm:px-24">
        <h1 className="text-2xl font-bold mb-6">Close {props.goalName}</h1>

        <form className="space-y-6" onSubmit={handleSubmit(submit)}>
          <div className="flex items-center gap-2">
            <PrimaryButton size="sm" type="submit">
              Close
            </PrimaryButton>
            <SecondaryButton size="sm" onClick={props.onCancel}>
              Cancel
            </SecondaryButton>
          </div>
        </form>
      </div>
    </Page>
  );
}
