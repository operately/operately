import * as React from "react";
import * as GoalCheckIns from "@/models/goalCheckIns";
import * as Pages from "@/components/Pages";

import { PrimaryButton } from "turboui";

import { useLoadedData } from "./loader";
import { useMe } from "@/contexts/CurrentCompanyContext";
import { compareIds } from "@/routes/paths";

//
// There are two ways in which the AckCTA component is used:
//
// - For manual acknowledgements.
// - For automatic acknowledgements (when the user navigates to the page with ?acknowledge=true).
//
// When the manual acknowledgement path is used, the user will see a button that they can click to
// acknowledge the check-in. When the automatic acknowledgement path is used, the check-in will be
// acknowledged immediately and the button will not be shown.
//
// The button is shown when:
//
// - The check-in has not been acknowledged already.
// - The user has permission to acknowledge (edit access, and not the author).
// - The user is the current goal champion or reviewer.
// - The acknowledgement is not automatic via the URL parameter.
//

export function AckCTA() {
  const { update, goal } = useLoadedData();
  const me = useMe();
  const isViewMode = Pages.useIsViewMode();
  const isChampionOrReviewer = compareIds(goal.champion?.id, me?.id) || compareIds(goal.reviewer?.id, me?.id);
  const canAcknowledge =
    isViewMode && !update.acknowledgedAt && !!update.permissions?.canAcknowledge && isChampionOrReviewer;

  const ackOnLoad = shouldAcknowledgeOnLoad();
  const ackHandler = useAcknowledgeHandler(goal.id, update, ackOnLoad, canAcknowledge);

  if (ackOnLoad || !canAcknowledge) return null;

  return (
    <div className="flex flex-row items-center justify-center mt-8 mb-4">
      <PrimaryButton testId="acknowledge-check-in" onClick={ackHandler}>
        Acknowledge this Check-In
      </PrimaryButton>
    </div>
  );
}

function useAcknowledgeHandler(
  goalId: string,
  update: GoalCheckIns.Update,
  ackOnLoad: boolean,
  canAcknowledge: boolean,
) {
  const ack = GoalCheckIns.useAcknowledgeGoalProgressUpdate(goalId);

  const handleAck = async () => {
    if (!canAcknowledge) return;

    await ack.mutateAsync({ id: update.id });
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
