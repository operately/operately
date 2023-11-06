import * as React from "react";
import * as Updates from "@/graphql/Projects/updates";

import { GhostButton } from "@/components/Button";

import { useLoadedData, usePageRefetch } from "./loader";

export function AckCTA() {
  const { project, update, me } = useLoadedData();
  const refetch = usePageRefetch();

  const [ack, { loading }] = Updates.useAckUpdate();

  if (update.acknowledged) return null;
  if (!project.reviewer) return null;
  if (project.reviewer.id !== me.id) return null;

  const handleAck = async () => {
    await ack({
      variables: {
        id: update.id,
      },
    });

    refetch();
  };

  return (
    <div className="flex flex-row items-center justify-center mt-4 mb-4">
      <GhostButton size="lg" testId="acknowledge-update" loading={loading} onClick={handleAck}>
        Acknowledge this Check-In
      </GhostButton>
    </div>
  );
}
