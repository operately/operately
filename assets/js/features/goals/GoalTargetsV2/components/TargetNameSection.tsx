import React from "react";

import * as Goals from "@/models/goals";
import classNames from "classnames";
import { MiniPieChart } from "@/components/charts";
import { Target } from "../types";

interface Props {
  target: Target;
}

export function TargetNameSection({ target }: Props) {
  const progress = Goals.targetProgressPercentage(target);
  const nameClass = classNames("flex items-center gap-2 flex-1 truncate");

  return (
    <div className={nameClass}>
      <MiniPieChart completed={progress} total={100} size={16} />
      <NameView name={target.name!} />
    </div>
  );
}

function NameView({ name }: { name: string }) {
  return <div className="font-medium truncate">{name}</div>;
}
