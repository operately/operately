import React from "react";

import type { Target } from "./types";
export type { Target };

import { DragAndDropProvider, useDraggingAnimation, useDropZone } from "@/features/DragAndDrop";

import { EditTargetCard } from "./EditTargetCard";
import { AddTargetButton } from "./AddTargetButton";
import { TargetsContextProvider, useTargetsContext } from "./TargetsContext";
import { DefaultTargetCard } from "./DefaultTargetCard";

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
      <DragAndDropWrapper>
        <Targets {...props} />
      </DragAndDropWrapper>

      <AddTargetButton display={Boolean(!props.readonly && props.editDefinition)} />
    </TargetsContextProvider>
  );
}

function DragAndDropWrapper({ children }) {
  const { reorderTargets } = useTargetsContext();

  return <DragAndDropProvider onDrop={reorderTargets}>{children}</DragAndDropProvider>;
}

function Targets(props: Props) {
  const editDefinition = Boolean(!props.readonly && props.editDefinition);
  const { targets } = useTargetsContext();

  const { ref } = useDropZone({ id: "targets", dependencies: [targets] });
  const { itemStyle } = useDraggingAnimation("targets", targets);

  if (editDefinition) {
    return (
      <div ref={ref}>
        {targets.map((target, index) => (
          <EditTargetCard key={target.id} target={target} index={index} style={itemStyle(target.id!)} />
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
