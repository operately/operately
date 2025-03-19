import React from "react";

import * as Goals from "@/models/goals";
import classNames from "classnames";
import { MiniPieChart } from "@/components/charts";
import { Target } from "./types";

interface Props {
  target: Target;
  dotsBetween?: boolean;
}

export function TargetNameSection({ target, dotsBetween }: Props) {
  const progress = Goals.targetProgressPercentage(target);
  const nameClass = classNames("flex items-center gap-2 flex-1 truncate");

  return (
    <div className={nameClass}>
      <MiniPieChart completed={progress} total={100} size={16} />
      <NameView name={target.name!} />
      {dotsBetween && <Dots />}
    </div>
  );
}

function NameView({ name }: { name: string }) {
  return <div className="font-medium truncate">{name}</div>;
}

function Dots() {
  return <div className="flex-1 border-t-2 border-dotted border-stroke-base mx-1 mr-3" />;
}
