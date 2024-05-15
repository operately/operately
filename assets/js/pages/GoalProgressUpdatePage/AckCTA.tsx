import * as React from "react";
import * as GoalCheckIns from "@/models/goalCheckIns";

import { FilledButton } from "@/components/Button";

import { useLoadedData, useRefresh } from "./loader";

export function AckCTA() {
  const { goal, update } = useLoadedData();
  const refresh = useRefresh();

  const [ack] = GoalCheckIns.useAckUpdate({
    onCompleted: refresh,
  });

  if (update.acknowledged) return null;
  if (!goal.permissions.canAcknowledgeCheckIn) return null;

  const handleAck = async () => {
    await ack({
      variables: {
        id: update.id,
      },
    });

    refresh();
  };

  return (
    <div className="flex flex-row items-center justify-center mt-4 mb-4">
      <FilledButton testId="acknowledge-check-in" onClick={handleAck}>
        Acknowledge this Check-In
      </FilledButton>
    </div>
  );
}
