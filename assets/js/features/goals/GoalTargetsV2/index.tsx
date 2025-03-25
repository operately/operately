import React from "react";

import { EditTargetCard } from "./EditTargetCard";
import { AddTargetButton } from "./AddTargetButton";
import { TargetsContextProvider, useTargetsContext } from "./TargetsContext";
import { Target } from "./types";
import { DefaultTargetCard } from "./DefaultTargetCard";

export { Target };

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
  const { targets } = useTargetsContext();
  const editDefinition = Boolean(!props.readonly && props.editDefinition);

  return (
    <>
      {targets.map((target, index) =>
        editDefinition ? (
          <EditTargetCard key={target.id} target={target} index={index} />
        ) : (
          <DefaultTargetCard
            key={target.id}
            index={index}
            target={target}
            readonly={props.readonly}
            editValue={props.editValue ?? true}
          />
        ),
      )}
    </>
  );
}
