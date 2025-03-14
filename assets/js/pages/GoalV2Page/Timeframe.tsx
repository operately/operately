import React from "react";

import Forms from "@/components/Forms";
import { useIsViewMode } from "@/components/Pages";
import { assertPresent } from "@/utils/assertions";

import { useLoadedData } from "./loader";
import { findTimeLeft } from "./utils";
import { Title } from "./components";

export function Timeframe() {
  const { goal } = useLoadedData();
  const isViewMode = useIsViewMode();

  assertPresent(goal.timeframe, "timeframe must be present in goal");

  const timeLeft = findTimeLeft(goal.timeframe);

  return (
    <div>
      <Forms.FieldGroup>
        <Forms.TimeframeField
          readonly={isViewMode}
          field="timeframe"
          customLabel={<Title title="Timeframe" />}
          completedColor={isViewMode ? "stone" : "indigo"}
        />
      </Forms.FieldGroup>
      <div className="mt-2 text-xs text-content-dimmed">{timeLeft}</div>
    </div>
  );
}
