import * as React from "react";
import * as ProjectCheckIns from "@/models/projectCheckIns";

import { FilledButton } from "@/components/Button";

import { useLoadedData, useRefresh } from "./loader";

export function AckCTA() {
  const { checkIn } = useLoadedData();
  const refresh = useRefresh();

  const [ack] = ProjectCheckIns.useAckMutation();

  if (checkIn.acknowledgedAt) return null;
  if (!checkIn.project.permissions.canAcknowledgeCheckIn) return null;

  const handleAck = async () => {
    await ack({
      variables: {
        id: checkIn.id,
      },
    });

    refresh();
  };

  return (
    <div className="flex flex-row items-center justify-center mt-4 mb-4">
      <FilledButton size="lg" testId="acknowledge-check-in" onClick={handleAck}>
        Acknowledge this Check-In
      </FilledButton>
    </div>
  );
}
