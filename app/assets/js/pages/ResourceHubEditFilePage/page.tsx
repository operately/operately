import React from "react";
import { useNavigate } from "react-router";

import { files } from "@/models/resourceHubs";
import { useRichEditorHandlers } from "@/hooks/useRichEditorHandlers";
import { usePaths } from "@/routes/paths";
import { assertPresent } from "@/utils/assertions";
import { FileEditPage, showErrorToast } from "turboui";
import type { FileEditPage as FileEditPageTypes } from "turboui/FileEditPage/types";

import { useLoadedData } from "./loader";
import { buildEditFilePageNavigation } from "./navigation";

export function Page() {
  const { file } = useLoadedData();
  const paths = usePaths();
  const navigate = useNavigate();
  const [edit] = files.useUpdate();

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
      showErrorToast("File not updated", "Check the form and try again.");
      return false;
    }
  }

  return (
    <FileEditPage
      pageTitle="Edit File"
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
