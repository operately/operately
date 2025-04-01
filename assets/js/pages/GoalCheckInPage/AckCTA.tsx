import * as React from "react";
import * as People from "@/models/people";
import * as GoalCheckIns from "@/models/goalCheckIns";
import * as Pages from "@/components/Pages";

import { PrimaryButton } from "@/components/Buttons";

import { useLoadedData, useRefresh } from "./loader";
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
// There are other conditions that must be met for the button to be shown:
//
// - The check-in must not have been acknowledged already.
// - The user must have the permission to acknowledge the check-in.
// - The user must be the reviewer of the project.
// - The project must have a reviewer.
// - The acknowledgement is not automatic via the URL parameter.
//

export function AckCTA() {
  const me = useMe();
  const { update } = useLoadedData();

  const ackOnLoad = shouldAcknowledgeOnLoad();
  const showButton = showAcknowledgeButton(update, me!);
  const ackHandler = useAcknowledgeHandler(update, ackOnLoad);

  if (ackOnLoad || !showButton) return null;

  return (
    <div className="flex flex-row items-center justify-center mt-8 mb-4">
      <PrimaryButton testId="acknowledge-check-in" onClick={ackHandler}>
        Acknowledge this Check-In
      </PrimaryButton>
    </div>
  );
}

function showAcknowledgeButton(update: GoalCheckIns.Update, me: People.Person) {
  const isViewMode = Pages.useIsViewMode();

  if (!isViewMode) return false;
  if (update.acknowledgedAt) return false;
  if (!update.permissions!.canAcknowledge) return false;

  const reviewer = update.goal!.reviewer;
  if (!reviewer) return false;

  if (!compareIds(reviewer.id, me.id)) return false;

  return true;
}

function useAcknowledgeHandler(update: GoalCheckIns.Update, ackOnLoad: boolean) {
  const refresh = useRefresh();
  const [ack] = GoalCheckIns.useAcknowledgeGoalProgressUpdate();

  const handleAck = async () => {
    if (update.acknowledgedAt) return;
    if (!update.permissions!.canAcknowledge) return;

    await ack({ id: update.id });

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
