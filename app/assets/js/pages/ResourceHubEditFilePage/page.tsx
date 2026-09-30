import React from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";

import { useUpdateFile } from "@/models/resourceHubs";
import { useRichEditorHandlers } from "@/hooks/useRichEditorHandlers";
import { usePaths } from "@/routes/paths";
import { assertPresent } from "@/utils/assertions";
import { FileEditPage, showErrorToast, type FileEditPageTypes } from "turboui";

import { useLoadedData } from "./loader";
import { buildEditFilePageNavigation } from "./navigation";

export function Page() {
  const { t } = useTranslation();
  const { file } = useLoadedData();
  const paths = usePaths();
  const navigate = useNavigate();

  const mutationScope = {
    spaceId: file.space?.id,
    resourceHubId: file.resourceHubId,
    parentFolderId: file.parentFolderId,
  };
  const { mutateAsync: edit } = useUpdateFile(mutationScope);

  assertPresent(file.name, "name must be present in file");
  assertPresent(file.description, "description must be present in file");
  assertPresent(file.resourceHubId, "resourceHubId must be present in file");

  const richTextHandlers = useRichEditorHandlers({ scope: { type: "resource_hub", id: file.resourceHubId } });
  const cancelLink = paths.resourceHubFilePath(file.id!);
  const initialDescription = JSON.parse(file.description);

  async function handleSubmit(values: FileEditPageTypes.Values, meta: { contentChanged: boolean }) {
    try {
      if (meta.contentChanged) {
        await edit({
          fileId: file.id,
          name: values.title,
          description: JSON.stringify(values.description),
        });
      }
      navigate(cancelLink);
      return true;
    } catch {
      showErrorToast(t("File not updated"), t("Check the form and try again."));
      return false;
    }
  }

  return (
    <FileEditPage
      pageTitle={t("Edit File")}
      navigation={buildEditFilePageNavigation(file, paths)}
      testId="resource-hub-edit-file-page"
      richTextHandlers={richTextHandlers}
      initialTitle={file.name}
      initialDescription={initialDescription}
      cancelLink={cancelLink}
      onSubmit={handleSubmit}
    />
  );
}
