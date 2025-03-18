import React from "react";

import * as GoalCheckIns from "@/models/goalCheckIns";

import Forms from "@/components/Forms";
import { isPresent } from "@/utils/isPresent";
import { isCheckInTarget, Target } from "./types";

interface Props {
  readonly: boolean;
  target: Target;
  index: number;
}

export function TargetValue(props: Props) {
  if (props.readonly) {
    return <ValueDisplay target={props.target} />;
  }
  return <ValueEdit index={props.index} />;
}

function ValueDisplay({ target }: { target: Target }) {
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

function ValueDifference({ target }: { target: Target }) {
  if (!isPresent(target.value) || !isCheckInTarget(target) || !isPresent(target.previousValue)) {
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleBlur();
      e.currentTarget.blur();
    }
  };

  return (
    <div>
      <input
        type="text"
        onChange={(e) => setTempValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        value={tempValue || ""}
        className="ring-0 bg-surface-base text-content-accent outline-none px-2 py-1.5 text-sm font-medium w-32 text-right border border-stroke-base rounded"
      />
      {error && <div className="text-xs text-content-error mt-0.5">{error}</div>}
    </div>
  );
}
