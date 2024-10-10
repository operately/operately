import * as React from "react";
import * as GoalCheckIns from "@/models/goalCheckIns";

import { PrimaryButton } from "@/components/Buttons";

import { useLoadedData, useRefresh } from "./loader";
import { useMe } from "@/contexts/CurrentUserContext";
import { compareIds } from "@/routes/paths";

export function AckCTA() {
  const me = useMe();
  const { update } = useLoadedData();
  const refresh = useRefresh();

  const [ack] = GoalCheckIns.useAcknowledgeGoalProgressUpdate();

  if (update.acknowledged) return null;
  if (!update.goal!.permissions!.canAcknowledgeCheckIn) return null;
  if (!compareIds(update.goal!.reviewer!.id, me!.id)) return null;

  const handleAck = async () => {
    await ack({ id: update.id });

    refresh();
  };

  return (
    <div className="flex flex-row items-center justify-center mt-4 mb-4">
      <PrimaryButton testId="acknowledge-check-in" onClick={handleAck}>
        Acknowledge this Update
      </PrimaryButton>
    </div>
  );
}
