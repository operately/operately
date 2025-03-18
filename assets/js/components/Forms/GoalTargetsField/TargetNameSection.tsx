import React from "react";

import * as Goals from "@/models/goals";
import { Target } from "@/models/goalCheckIns";
import classNames from "classnames";
import { MiniPieChart } from "@/components/charts";
import Forms from "@/components/Forms";

interface Props {
  target: Target;
  index: number;
  readonly: boolean;
  dotsBetween?: boolean;
}

export function TargetNameSection({ target, index, readonly, dotsBetween }: Props) {
  const progress = Goals.targetProgressPercentage(target);
  const nameClass = classNames("flex items-center gap-2 flex-1", { truncate: readonly });

  return (
    <div className={nameClass}>
      <MiniPieChart completed={progress} total={100} size={16} />
      {readonly ? <NameView name={target.name!} /> : <NameEdit index={index} />}
      {dotsBetween && <Dots />}
    </div>
  );
}

function NameView({ name }: { name: string }) {
  return <div className="font-medium truncate">{name}</div>;
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

function Dots() {
  return <div className="flex-1 border-t-2 border-dotted border-stroke-base mx-1 mr-3" />;
}
