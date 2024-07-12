import * as React from "react";
import * as GoalCheckIns from "@/models/goalCheckIns";

import { FilledButton } from "@/components/Button";

import { useLoadedData, useRefresh } from "./loader";

export function AckCTA() {
  const { update } = useLoadedData();
  const refresh = useRefresh();

  const [ack] = GoalCheckIns.useAcknowledgeGoalProgressUpdate();

  if (update.acknowledged) return null;
  if (!update.goal!.permissions!.canAcknowledgeCheckIn) return null;

  const handleAck = async () => {
    await ack({ id: update.id });

    refresh();
  };

  return (
    <div className="flex flex-row items-center justify-center mt-4 mb-4">
      <FilledButton testId="acknowledge-check-in" onClick={handleAck}>
        Acknowledge this Update
      </FilledButton>
    </div>
  );
}
