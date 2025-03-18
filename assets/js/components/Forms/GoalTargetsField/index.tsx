import React from "react";

import { IconChevronDown } from "@tabler/icons-react";
import * as Goals from "@/models/goals";
import * as GoalCheckIns from "@/models/goalCheckIns";

import classNames from "classnames";
import { useFieldValue } from "../FormContext";
import { InputField } from "../FieldGroup";
import { useValidation } from "../validations/hook";
import { validatePresence } from "../validations/presence";

import { getReadonlyFlags } from "./utils";
import { TargetNameSection } from "./TargetNameSection";
import { TargetDetails } from "./TargetDetails";
import { TargetValue } from "./TargetValue";

interface StylesOptions {
  hideBorder?: boolean;
  dotsBetween?: boolean;
}

interface Props extends StylesOptions {
  field: string;
  label?: string;
  readonly?: boolean;
  editValue?: boolean;
  editDefinition?: boolean;
}

export function GoalTargetsField(props: Props) {
  const [targets] = useFieldValue<Goals.Target[]>(props.field);

  return (
    <InputField field={props.field} label={props.label}>
      {targets.map((target, index) => (
        <TargetCard
          key={target.id}
          index={index}
          target={target}
          readonly={props.readonly}
          hideBorder={props.hideBorder}
          dotsBetween={props.dotsBetween}
          editValue={props.editValue ?? true}
          editDefinition={props.editDefinition}
        />
      ))}
    </InputField>
  );
}

interface TargetCardProps extends StylesOptions {
  index: number;
  target: GoalCheckIns.Target;
  readonly?: boolean;
  editValue?: boolean;
  editDefinition?: boolean;
}

function TargetCard(props: TargetCardProps) {
  const { index, target, readonly, hideBorder, dotsBetween, editValue, editDefinition } = props;

  const { readonlyName, readonlyValue } = getReadonlyFlags({ readonly, editDefinition, editValue });
  useValidation(`targets[${index}].name`, validatePresence(true));

  const containerClass = classNames("max-w-full py-2 px-px", {
    "border-t last:border-b border-stroke-base": !hideBorder,
  });

  return (
    <details className={containerClass}>
      <summary className="grid grid-cols-[1fr_auto_14px] gap-2 items-center cursor-pointer">
        <TargetNameSection
          target={target}
          index={index}
          readonly={readonlyName}
          dotsBetween={dotsBetween && readonlyName}
        />
        <TargetValue readonly={readonlyValue} index={index} target={target} />
        <IconChevronDown className="ml-2" size={14} />
      </summary>
      <TargetDetails target={target} />
    </details>
  );
}
