import * as React from "react";
import * as People from "@/models/people";
import * as ProjectCheckIns from "@/models/projectCheckIns";

import { PrimaryButton } from "@/components/Buttons";

import { useLoadedData, useRefresh } from "./loader";
import { useMe } from "@/contexts/CurrentUserContext";
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
  const { checkIn } = useLoadedData();

  const ackOnLoad = shouldAcknowledgeOnLoad();
  const showButton = showAcknowledgeButton(checkIn, me!);
  const ackHandler = useAcknowledgeHandler(checkIn, ackOnLoad);

  if (ackOnLoad || !showButton) return null;

  return (
    <div className="flex flex-row items-center justify-center mt-4 mb-4">
      <PrimaryButton size="lg" testId="acknowledge-check-in" onClick={ackHandler}>
        Acknowledge this Check-In
      </PrimaryButton>
    </div>
  );
}

function showAcknowledgeButton(checkIn: ProjectCheckIns.ProjectCheckIn, me: People.Person) {
  if (checkIn.acknowledgedAt) return false;
  if (!checkIn.project!.permissions!.canAcknowledgeCheckIn) return false;

  const reviewer = checkIn.project!.reviewer;
  if (!reviewer) return false;

  if (!compareIds(reviewer.id, me.id)) return false;

  return true;
}

function useAcknowledgeHandler(checkIn: ProjectCheckIns.ProjectCheckIn, ackOnLoad: boolean) {
  const refresh = useRefresh();
  const [ack] = ProjectCheckIns.useAcknowledgeProjectCheckIn();

  const handleAck = async () => {
    if (checkIn.acknowledgedAt) return;
    if (!checkIn.project!.permissions!.canAcknowledgeCheckIn) return;

    await ack({ id: checkIn.id });

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
