import React from "react";
import { GoalPage } from "turboui";
import { Timeframe } from "turboui/src/utils/timeframes";

interface LoaderResult {}

export async function loader({}): Promise<LoaderResult> {
  return {}; // TODO: Load data here
}

export function Page() {
  const props: GoalPage.Props = {
    targets: [],
    checkIns: [],
    messages: [],
    contributors: [],
    relatedWorkItems: [],
    canEdit: false,
    description: "",
    status: "pending",
    timeframe: {
      startDate: new Date(),
      endDate: new Date(),
      type: "days" as const,
    },
    spaceLink: "",
    workmapLink: "",
    closeLink: "",
    deleteLink: "",
    parentGoal: null,
    goalName: "Example Goal",
    spaceName: "Example Space",
    privacyLevel: "internal",
    updateTimeframe: function (timeframe: Timeframe): Promise<void> {
      console.log("updateTimeframe", timeframe);
      throw new Error("Function not implemented.");
    },
  };

  return (
    <div className="sm:mt-8">
      <GoalPage {...props} />
    </div>
  );
}
