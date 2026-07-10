import * as React from "react";
import * as Goals from "@/models/goals";
import * as Pages from "@/components/Pages";
import * as Activities from "@/models/activities";

import { PrimaryButton, IconSquareCheckFilled } from "turboui";

import { useLoaderData } from "./loader";

export function AckCTA() {
  const { activity } = useLoaderData();

  if (activity.action !== "goal_closing") return null;

  const ackOnLoad = shouldAcknowledgeOnLoad();
  const showButton = showAcknowledgeButton(activity);
  const ackHandler = useAcknowledgeHandler(activity, ackOnLoad);

  if (ackOnLoad || !showButton) return null;

  return (
    <div className="flex flex-row items-center justify-center mt-8 mb-4">
      <PrimaryButton testId="acknowledge-retrospective" onClick={ackHandler}>
        Acknowledge Retrospective
      </PrimaryButton>
    </div>
  );
}

export function AcknowledgementStatus() {
  const { activity } = useLoaderData();

  if (activity.action !== "goal_closing") return null;

  if (activity.commentThread?.acknowledgedAt) {
    return (
      <span className="flex items-center gap-1">
        <IconSquareCheckFilled size={16} className="text-accent-1" />
        Acknowledged by {activity.commentThread.acknowledgedBy?.fullName}
      </span>
    );
  }

  return <span className="flex items-center gap-1">Not yet acknowledged</span>;
}

function showAcknowledgeButton(activity: Activities.Activity) {
  if (activity.commentThread?.acknowledgedAt) return false;
  return !!activity.permissions?.canAcknowledge;
}

function useAcknowledgeHandler(activity: Activities.Activity, ackOnLoad: boolean) {
  const refresh = Pages.useRefresh();
  const [ack] = Goals.useAcknowledgeGoalRetrospective();

  const handleAck = async () => {
    if (activity.commentThread?.acknowledgedAt) return;
    if (!activity.permissions?.canAcknowledge) return;

    await ack({ id: activity.id });

    refresh();
  };

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
