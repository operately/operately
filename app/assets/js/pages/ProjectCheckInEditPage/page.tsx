import React from "react";

import { useEditProjectCheckIn } from "@/models/projectCheckIns";
import { useFormattedTimePreferences } from "@/hooks/useFormattedTimePreferences";
import { useRichEditorHandlers } from "@/hooks/useRichEditorHandlers";
import { assertPresent } from "@/utils/assertions";
import { compareIds, usePaths } from "@/routes/paths";
import { isWithinTimeframe } from "@/utils/time";
import { useNavigate } from "react-router";
import { ProjectCheckInFormPage, displayDate, showErrorToast } from "turboui";

import { buildUnpublishedStateFields } from "./buildUnpublishedStateFields";
import { useLoadedData } from "./loader";
import { buildProjectCheckInEditNavigation } from "./navigation";

export function Page() {
  const { checkIn } = useLoadedData();
  const paths = usePaths();
  const navigate = useNavigate();
  const [edit] = useEditProjectCheckIn();
  const formattedTimePreferences = useFormattedTimePreferences();

  assertPresent(checkIn.project, "project must be present in checkIn");

  const richTextHandlers = useRichEditorHandlers({ scope: { type: "project", id: checkIn.project.id! } });

  const isUnpublished = checkIn.state === "draft" || checkIn.state === "scheduled";
  const allowFullEdit =
    isUnpublished ||
    (checkIn.project.lastCheckIn?.id
      ? compareIds(checkIn.project.lastCheckIn.id, checkIn.id) && isWithinTimeframe(displayDate(checkIn), 72)
      : false);

  async function handleSubmit(
    values: ProjectCheckInFormPage.Values,
    meta: ProjectCheckInFormPage.SubmitMeta,
  ): Promise<boolean> {
    if (meta.mode !== "edit") return false;
    if (!values.status || !values.description) return false;

    try {
      const res = await edit({
        checkInId: checkIn.id,
        status: values.status,
        description: JSON.stringify(values.description),
        ...buildUnpublishedStateFields(isUnpublished, meta, checkIn.scheduledAt),
      });

      navigate(paths.projectCheckInPath(res.checkIn.id));
      return true;
    } catch {
      showErrorToast("Check-in not updated", "Check the form and try again.");
      return false;
    }
  }

  return (
    <ProjectCheckInFormPage
      mode="edit"
      pageTitle={["Edit Project Check-In", checkIn.project.name!]}
      navigation={buildProjectCheckInEditNavigation(checkIn, paths)}
      cancelLink={paths.projectCheckInPath(checkIn.id!)}
      richTextHandlers={richTextHandlers}
      mentionedPersonLookup={richTextHandlers.mentionedPersonLookup}
      formattedTimePreferences={formattedTimePreferences}
      reviewer={checkIn.project.reviewer}
      checkIn={checkIn}
      allowFullEdit={allowFullEdit}
      onSubmit={handleSubmit}
    />
  );
}
