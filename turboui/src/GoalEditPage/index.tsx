import React from "react";
import { useForm } from "react-hook-form";
import { Page } from "../Page";
import { Textfield } from "../forms/Textfield";
import { PrimaryButton, SecondaryButton } from "../Button";

namespace GoalEditPage {
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

export function GoalEditPage(props: GoalEditPage.Props) {
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty, isValid },
  } = useForm<GoalEditPage.FormValues>({
    mode: "onBlur",
    defaultValues: { name: props.goalName },
  });

  const navigation = [
    { to: props.spaceLink, label: props.spaceName },
    { to: props.workmapLink, label: "Goals" },
    { to: props.goalLink, label: props.goalName },
  ];

  const submit = (data: GoalEditPage.FormValues) => {
    if (isDirty && isValid) {
      props.onSave(data.name);
    }
  };

  return (
    <Page title={["Edit Goal"]} size="medium" navigation={navigation}>
      <div className="p-12 sm:px-24">
        <h1 className="text-2xl font-bold mb-6">Edit {props.goalName}</h1>

        <form className="space-y-6" onSubmit={handleSubmit(submit)}>
          <Textfield
            label="Goal Name"
            placeholder="Enter a goal name..."
            maxLength={100}
            autoFocus
            error={errors.name?.message}
            {...register("name", { required: "Goal name is required" })}
          />
          <div className="flex items-center gap-2">
            <PrimaryButton size="sm" type="submit">
              Save
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
