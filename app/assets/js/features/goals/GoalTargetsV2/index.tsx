import React from "react";

import { AddTargetButton } from "./AddTargetButton";
import { DefaultTargetCard } from "./DefaultTargetCard";
import { EditTargetCard } from "./EditTargetCard";
import { TargetsContextProvider, useTargetsContext } from "./TargetsContext";

interface Props {
  field: string;
  label?: string;
  readonly?: boolean;
  editValue?: boolean;
  editDefinition?: boolean;
}

export function GoalTargetsField(props: Props) {
  return (
    <TargetsContextProvider
      // When the user clicks "Discard Changes", the targets managed by useForm are reset.
      // However, these changes aren't visible until the component remounts.
      // Using a key based on the `readonly` prop forces a remount whenever its value changes.
      key={String(props.readonly)}
      field={props.field}
    >
      <Targets {...props} />

      <AddTargetButton display={Boolean(!props.readonly && props.editDefinition)} />
    </TargetsContextProvider>
  );
}

function Targets(props: Props) {
  const editDefinition = Boolean(!props.readonly && props.editDefinition);
  const { targets } = useTargetsContext();

  if (editDefinition) {
    return (
      <div>
        {targets.map((target, index) => (
          <EditTargetCard key={target.id} target={target} index={index} />
        ))}
      </div>
    );
  }
  return (
    <>
      {targets.map((target, index) => (
        <DefaultTargetCard
          key={target.id}
          index={index}
          target={target}
          readonly={props.readonly}
          editValue={props.editValue ?? true}
        />
      ))}
    </>
  );
}
