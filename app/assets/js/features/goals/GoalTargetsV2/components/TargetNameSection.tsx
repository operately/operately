import React from "react";

import * as Goals from "@/models/goals";
import classNames from "classnames";
import { MiniPieChart } from "@/components/charts";
import { Target } from "../types";

interface Props {
  target: Target;
  truncate?: boolean;
}

export function TargetNameSection({ target, truncate }: Props) {
  const progress = Goals.targetProgressPercentage(target);
  const nameClass = classNames("flex gap-2 flex-1", { truncate: truncate });

  return (
    <div className={nameClass}>
      <div className="mt-1.5">
        <MiniPieChart completed={progress} total={100} size={16} />
      </div>
      <NameView name={target.name!} truncate={truncate} />
    </div>
  );
}

function NameView({ name, truncate }: { name: string; truncate?: boolean }) {
  const className = classNames("font-medium mt-0.5", { truncate: truncate });

  return <div className={className}>{name}</div>;
}
