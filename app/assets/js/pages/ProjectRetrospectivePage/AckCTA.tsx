import * as People from "@/models/people";
import * as Projects from "@/models/projects";
import * as React from "react";

import { PrimaryButton } from "turboui";

import { useMe } from "@/contexts/CurrentCompanyContext";
import { compareIds } from "@/routes/paths";
import { useLoadedData, useRefresh } from "./loader";

export function AckCTA() {
  const me = useMe();
  const { retrospective } = useLoadedData();

  const ackOnLoad = shouldAcknowledgeOnLoad();
  const showButton = showAcknowledgeButton(retrospective, me!);
  const ackHandler = useAcknowledgeHandler(retrospective, ackOnLoad);

  if (ackOnLoad || !showButton) return null;

  return (
    <div className="flex flex-row items-center justify-center mt-4 mb-4">
      <PrimaryButton size="lg" testId="acknowledge-retrospective" onClick={ackHandler}>
        Acknowledge Retrospective
      </PrimaryButton>
    </div>
  );
}

function showAcknowledgeButton(retrospective: Projects.ProjectRetrospective, me: People.Person) {
  if (retrospective.acknowledgedAt) return false;

  const permissions = retrospective.permissions;
  if (!permissions?.canEdit) return false;

  const isAuthor = compareIds(retrospective.author?.id, me.id);

  if (isAuthor) return false;

  const reviewer = retrospective.reviewer;
  const champion = retrospective.champion;

  const isReviewer = reviewer ? compareIds(reviewer.id, me.id) : false;
  const isChampion = champion ? compareIds(champion.id, me.id) : false;

  return isReviewer || isChampion;
}

function useAcknowledgeHandler(retrospective: Projects.ProjectRetrospective, ackOnLoad: boolean) {
  const me = useMe();
  const refresh = useRefresh();
  const [ack] = Projects.useAcknowledgeProjectRetrospective();

  const handleAck = async () => {
    if (!showAcknowledgeButton(retrospective, me!)) return;

    await ack({ id: retrospective.id });

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
