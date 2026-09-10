import * as React from "react";
import * as Goals from "@/models/goals";

import { PrimaryButton, IconSquareCheckFilled } from "turboui";

import { useLoadedData } from "./loader";
import { useMe } from "@/contexts/CurrentCompanyContext";
import { compareIds } from "@/routes/paths";

export function AckCTA() {
  const { activity, goal } = useLoadedData();

  const me = useMe();
  const isChampionOrReviewer = compareIds(goal.champion?.id, me?.id) || compareIds(goal.reviewer?.id, me?.id);
  const canAcknowledge =
    activity.action === "goal_closing" &&
    !activity.commentThread?.acknowledgedAt &&
    !!activity.permissions?.canAcknowledge &&
    isChampionOrReviewer;

  const ackOnLoad = shouldAcknowledgeOnLoad();
  const ackHandler = useAcknowledgeHandler(goal, ackOnLoad, canAcknowledge);

  if (ackOnLoad || !canAcknowledge) return null;

  return (
    <div className="flex flex-row items-center justify-center mt-8 mb-4">
      <PrimaryButton testId="acknowledge-retrospective" onClick={ackHandler}>
        Acknowledge Retrospective
      </PrimaryButton>
    </div>
  );
}

export function AcknowledgementStatus() {
  const { activity } = useLoadedData();

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

function useAcknowledgeHandler(goal: Goals.Goal, ackOnLoad: boolean, canAcknowledge: boolean) {
  const ack = Goals.useAcknowledgeGoalRetrospective();

  const handleAck = async () => {
    if (!canAcknowledge) return;

    await ack.mutateAsync({ goalId: goal.id });
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
