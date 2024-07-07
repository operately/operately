import * as React from "react";
import * as ProjectCheckIns from "@/models/projectCheckIns";

import { FilledButton } from "@/components/Button";

import { useLoadedData, useRefresh } from "./loader";

export function AckCTA() {
  const { checkIn } = useLoadedData();

  const ackOnLoad = shouldAcknowledgeOnLoad();
  const ackHandler = useAcknowledgeHandler(checkIn, ackOnLoad);

  if (checkIn.acknowledgedAt) return null;
  if (!checkIn.project!.permissions!.canAcknowledgeCheckIn) return null;
  if (ackOnLoad) return null;

  return (
    <div className="flex flex-row items-center justify-center mt-4 mb-4">
      <FilledButton size="lg" testId="acknowledge-check-in" onClick={ackHandler}>
        Acknowledge this Check-In
      </FilledButton>
    </div>
  );
}

function useAcknowledgeHandler(checkIn: ProjectCheckIns.ProjectCheckIn, ackOnLoad: boolean) {
  const refresh = useRefresh();
  const [ack] = ProjectCheckIns.useAckMutation();

  const handleAck = async () => {
    if (checkIn.acknowledgedAt) return;
    if (!checkIn.project!.permissions!.canAcknowledgeCheckIn) return;

    await ack({
      variables: {
        id: checkIn.id,
      },
    });

    refresh();
  };

  //
  // If the user navigated to this page with ?acknowledge=true, acknowledge the check-in
  // immediately. This is useful for email links.
  //
  React.useEffect(() => {
    if (ackOnLoad) {
      handleAck();
    }
  }, []);

  return handleAck;
}

function shouldAcknowledgeOnLoad() {
  const search = new URLSearchParams(window.location.search);
  return search.get("acknowledge") === "true";
}
