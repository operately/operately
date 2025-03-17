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

interface StylesOptions {
  hideBorder?: boolean;
  dotsBetween?: boolean;
}

interface Props extends StylesOptions {
  field: string;
  label?: string;
  readonly?: boolean;
}

export function GoalTargetsField(props: Props) {
  const [targets] = useFieldValue<Goals.Target[]>(props.field);

  return (
    <InputField field={props.field} label={props.label}>
      {targets.map((target, index) => (
        <TargetCard key={index} index={index} target={target} {...props} />
      ))}
    </InputField>
  );
}

interface TargetCardProps extends StylesOptions {
  index: number;
  target: GoalCheckIns.Target;
  readonly?: boolean;
}

function TargetCard(props: TargetCardProps) {
  const containerClass = classNames("max-w-full py-2 px-px", {
    "border-t last:border-b border-stroke-base": !props.hideBorder,
  });

  return (
    <details className={containerClass}>
      <summary className="grid grid-cols-[1fr_auto_14px] items-center cursor-pointer">
        <div className="flex items-center gap-2 flex-1 truncate">
          <TargetPieChart target={props.target} />
          <TargetName target={props.target} />
          {props.dotsBetween && <Dots />}
        </div>

        {props.readonly ? (
          <TargetValue target={props.target} />
        ) : (
          <TargetInput target={props.target} index={props.index} />
        )}
        <IconChevronDown className="ml-2" size={14} />
      </summary>

      <TargetDetails target={props.target} />
    </details>
  );
}

function TargetValue({ target }: { target: GoalCheckIns.Target }) {
  return (
    <div className="flex items-center">
      <div className="py-1 text-right text-sm">
        <span className="font-extrabold">{target.value}</span>
        {target.unit === "%" ? "%" : ` ${target.unit}`}
      </div>
      <TargetValueDiff target={target} />
    </div>
  );
}

function TargetPieChart({ target }: { target: GoalCheckIns.Target }) {
  const progress = Goals.targetProgressPercentage(target);

  return <MiniPieChart completed={progress} total={100} size={16} />;
}

function TargetDetails({ target }: { target: GoalCheckIns.Target }) {
  const progress = Goals.targetProgressPercentage(target);

  return (
    <div className="text-sm ml-6 rounded-lg my-2">
      <div className="flex items-center gap-2">
        <div className="w-20 font-semibold">Target</div>
        <div className="flex items-center gap-2">
          <div className="flex-1">
            From <span className="font-semibold">{target.from}</span> {target.from! > target.to! ? "down to" : "to"}{" "}
            <span className="font-semibold">{target.to}</span>
            {target.unit === "%" ? "%" : ` ${target.unit}`}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 mt-1">
        <div className="w-20 font-semibold">Current</div>
        <div className="">
          {target.value} {target.unit} ({progress.toFixed(1)}%)
        </div>
      </div>
    </div>
  );
}

function TargetInput({ index }: { target: Goals.Target; index: number }) {
  const [value, setValue] = Forms.useFieldValue<number | null>(`targets[${index}].value`);
  const [tempValue, setTempValue] = React.useState<string>(value?.toString() || "");
  const error = Forms.useFieldError(`targets[${index}].value`);

  const onBlur = () => {
    const parsedValue = parseFloat(tempValue);

    if (isNaN(parsedValue)) {
      setTempValue(value?.toString() || "");
    } else {
      setValue(parsedValue);
      setTempValue(parsedValue.toString());
    }
  };

  return (
    <div className="">
      <div>
        <input
          type="text"
          onChange={(e) => setTempValue(e.target.value)}
          onBlur={onBlur}
          value={tempValue || ""}
          className="ring-0 outline-none px-2 py-1.5 text-sm font-medium w-32 text-right border border-stroke-base rounded"
        />
      </div>

      {error && <div className="text-xs text-content-error mt-0.5">{error}</div>}
    </div>
  );
}

function TargetName({ target }: { target: GoalCheckIns.Target }) {
  return <div className="font-medium truncate">{target.name}</div>;
}

function TargetValueDiff({ target }: { target: GoalCheckIns.Target }) {
  if (!isPresent(target.value)) return null;
  if (!isPresent(target.previousValue)) return null;

  const diff = target.value - target.previousValue;
  if (diff === 0) return null;

  const sentiment = GoalCheckIns.targetChangeSentiment(target);
  const diffText = `${Math.abs(diff)}`;
  const diffSign = diff > 0 ? "+" : "-";
  const color = sentiment === "positive" ? "text-green-600" : "text-content-error";

  return (
    <div className={"text-xs ml-2 font-mono font-bold" + " " + color}>
      {diffSign}
      {diffText}
    </div>
  );
}

function Dots() {
  return <div className="flex-1 border-t-2 border-dotted border-stroke-base mx-1 mr-3"></div>;
}
