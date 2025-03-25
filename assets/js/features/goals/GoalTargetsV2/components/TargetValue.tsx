import React from "react";

import * as GoalCheckIns from "@/models/goalCheckIns";

import { createTestId } from "@/utils/testid";
import { isPresent } from "@/utils/isPresent";
import { isCheckInTarget, Target } from "../types";
import { TargetNumericField } from "./TargetNumericField";

interface Props {
  readonly: boolean;
  target: Target;
  index: number;
}

export function TargetValue(props: Props) {
  if (props.readonly) {
    return <ValueDisplay target={props.target} />;
  }
  return (
    <TargetNumericField
      field="value"
      target={props.target}
      testid={createTestId("target", "input", props.target.name!)}
      className="ring-0 outline-none px-2 py-1.5 text-sm font-medium w-32 text-right border border-stroke-base rounded"
    />
  );
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
