import { useUpdateTemplateFile } from "@/models/projectTemplates/projectTemplateEditorLifecycle";
import { loader, useLoadedData } from "./loader";
import { useRichEditorHandlers } from "@/hooks/useRichEditorHandlers";
import { buildProjectTemplateResourceNavigation } from "@/models/projectTemplates/pageNavigation";
import { usePaths } from "@/routes/paths";
import type { PageModule } from "@/routes/types";
import { FileEditPage, emptyContent, showErrorToast } from "turboui";
import type { FileEditPage as FileEditPageTypes } from "turboui/FileEditPage/types";
import { useNavigate } from "react-router";
import React from "react";

export default { name: "ProjectTemplateEditFilePage", loader, Page } as PageModule;

function Page() {
  const { template, node } = useLoadedData();
  const updateFileMutation = useUpdateTemplateFile({ templateId: template.id, spaceId: template.space.id });
  const paths = usePaths();
  const navigate = useNavigate();
  const file = node.file;
  const richTextHandlers = useRichEditorHandlers({ scope: { type: "space", id: template.space.id } });
  const cancelLink = paths.projectTemplateFilePath(template.id, node.id);
  const initialDescription = file.description ? JSON.parse(file.description) : emptyContent();

  async function handleSubmit(values: FileEditPageTypes.Values, meta: { contentChanged: boolean }) {
    try {
      if (meta.contentChanged) {
        await updateFileMutation.mutateAsync({
          templateId: template.id,
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
      pageTitle={["Edit File", template.name]}
      navigation={buildProjectTemplateResourceNavigation(template, paths, {
        parentFolderId: node.parentFolderId,
        current: { to: cancelLink, label: file.name },
      })}
      testId="project-template-edit-file-page"
      richTextHandlers={richTextHandlers}
      initialTitle={file.name}
      initialDescription={initialDescription}
      cancelLink={cancelLink}
      onSubmit={handleSubmit}
    />
  );
}
