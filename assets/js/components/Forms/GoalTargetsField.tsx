import React from "react";

import { IconChevronDown } from "@tabler/icons-react";
import * as Goals from "@/models/goals";
import * as GoalCheckIns from "@/models/goalCheckIns";

import Forms from "@/components/Forms";
import { MiniPieChart } from "@/components/charts";
import { isPresent } from "@/utils/isPresent";

import { useFieldValue } from "./FormContext";
import { InputField } from "./FieldGroup";
import classNames from "classnames";
import { useValidation } from "./validations/hook";
import { validatePresence } from "./validations/presence";

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
  useValidation(`targets[${index}].name`, validatePresence(true));

  const readonlyValue = Boolean(readonly || !editValue);
  const readonlyName = Boolean(readonly || !editDefinition);

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

interface TargetNameProps {
  target: GoalCheckIns.Target;
  index: number;
  readonly: boolean;
  dotsBetween?: boolean;
}

function TargetNameSection({ target, index, readonly, dotsBetween }: TargetNameProps) {
  const progress = Goals.targetProgressPercentage(target);
  const nameClass = classNames("flex items-center gap-2 flex-1", { truncate: readonly });

  return (
    <div className={nameClass}>
      <MiniPieChart completed={progress} total={100} size={16} />
      {readonly ? <div className="font-medium truncate">{target.name}</div> : <NameEdit index={index} />}
      {dotsBetween && <div className="flex-1 border-t-2 border-dotted border-stroke-base mx-1 mr-3"></div>}
    </div>
  );
}

function NameEdit({ index }: { index: number }) {
  const [value, setValue] = Forms.useFieldValue(`targets[${index}].name`);
  const error = Forms.useFieldError(`targets[${index}].name`);

  const className = classNames(
    "w-full outline-none ring-0 px-2 py-1 border rounded font-medium",
    error ? "border-red-500" : "border-stroke-dimmed",
  );

  return (
    <div className="w-full relative">
      <input type="text" onChange={(e) => setValue(e.target.value)} value={value || ""} className={className} />
      {error && <div className="absolute text-xs text-content-error -bottom-4">{error}</div>}
    </div>
  );
}

function TargetValue(props: { readonly: boolean; target: GoalCheckIns.Target; index: number }) {
  if (props.readonly) {
    return <ValueDisplay target={props.target} />;
  }
  return <ValueEdit index={props.index} />;
}

function ValueDisplay({ target }: { target: GoalCheckIns.Target }) {
  return (
    <div className="flex items-center">
      <div className="py-1 text-right text-sm">
        <span className="font-extrabold">{target.value}</span>
        {target.unit === "%" ? "%" : ` ${target.unit}`}
      </div>
      <ValueDifference target={target} />
    </div>
  );
}

function ValueDifference({ target }: { target: GoalCheckIns.Target }) {
  if (!isPresent(target.value) || !isPresent(target.previousValue)) {
    return null;
  }

  const diff = target.value - target.previousValue;
  if (diff === 0) return null;

  const sentiment = GoalCheckIns.targetChangeSentiment(target);
  const diffText = `${Math.abs(diff)}`;
  const diffSign = diff > 0 ? "+" : "-";
  const color = sentiment === "positive" ? "text-green-600" : "text-content-error";

  return (
    <div className={`text-xs ml-2 font-mono font-bold ${color}`}>
      {diffSign}
      {diffText}
    </div>
  );
}

function ValueEdit({ index }: { index: number }) {
  const [value, setValue] = Forms.useFieldValue<number | null>(`targets[${index}].value`);
  const [tempValue, setTempValue] = React.useState<string>(value?.toString() || "");
  const error = Forms.useFieldError(`targets[${index}].value`);

  const handleBlur = () => {
    const parsedValue = parseFloat(tempValue);

    if (isNaN(parsedValue)) {
      setTempValue(value?.toString() || "");
    } else {
      setValue(parsedValue);
      setTempValue(parsedValue.toString());
    }
  };

  return (
    <div>
      <input
        type="text"
        onChange={(e) => setTempValue(e.target.value)}
        onBlur={handleBlur}
        value={tempValue || ""}
        className="ring-0 outline-none px-2 py-1.5 text-sm font-medium w-32 text-right border border-stroke-base rounded"
      />
      {error && <div className="text-xs text-content-error mt-0.5">{error}</div>}
    </div>
  );
}

function TargetDetails({ target }: { target: GoalCheckIns.Target }) {
  const progress = Goals.targetProgressPercentage(target);

  return (
    <div className="text-sm ml-6 rounded-lg my-2">
      <div className="flex items-center gap-2">
        <div className="w-20 font-semibold">Target</div>
        <div>
          From <span className="font-semibold">{target.from}</span> {target.from! > target.to! ? "down to" : "to"}{" "}
          <span className="font-semibold">{target.to}</span>
          {target.unit === "%" ? "%" : ` ${target.unit}`}
        </div>
      </div>

      <div className="flex items-center gap-2 mt-1">
        <div className="w-20 font-semibold">Current</div>
        <div>
          {target.value} {target.unit} ({progress.toFixed(1)}%)
        </div>
      </div>
    </div>
  );
}
