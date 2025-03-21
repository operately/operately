import React from "react";

import Forms from "@/components/Forms";
import * as Time from "@/utils/time";

import { useIsViewMode } from "@/components/Pages";
import { assertPresent } from "@/utils/assertions";

import { useLoadedData } from "./loader";
import { findTimeLeft } from "./utils";
import { Title } from "./components";
import classNames from "classnames";

export function Timeframe() {
  const { goal } = useLoadedData();
  const isViewMode = useIsViewMode();

  assertPresent(goal.timeframe, "timeframe must be present in goal");

  const timeLeft = findTimeLeft(goal.timeframe);
  const endDatePlusOne = Time.addDays(Time.parseDate(goal.timeframe.endDate)!, 1);

  const isDue = Time.isPast(endDatePlusOne);
  const textClassname = classNames("mt-2 text-xs", isDue ? "text-content-error" : "text-content-dimmed");

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
      <div className={textClassname}>{timeLeft}</div>
    </div>
  );
}
