import Api, { type ProjectTemplate, type ProjectTemplateResourceNode } from "@/api";
import * as Pages from "@/components/Pages";
import { findFileSize, useDownloadFile } from "@/models/blobs";
import { useFormattedTimePreferences } from "@/hooks/useFormattedTimePreferences";
import { useRichEditorHandlers } from "@/hooks/useRichEditorHandlers";
import { redirectIfFeatureNotEnabled } from "@/routes/redirectUtils";
import { compareIds, Paths, usePaths } from "@/routes/paths";
import type { PageModule } from "@/routes/types";
import { FilePage, IconDownload } from "turboui";
import React from "react";

export default { name: "ProjectTemplateFilePage", loader, Page } as PageModule;

interface LoadedData {
  template: ProjectTemplate;
  node: ProjectTemplateResourceNode;
}

async function loader({ params }): Promise<LoadedData> {
  await redirectIfFeatureNotEnabled(params, {
    feature: "project_templates",
    path: Paths.companyHomePath(params.companyId),
  });

  const { template } = await Api.project_templates.get({ id: params.templateId });
  const node = template.resourceNodes?.find((resourceNode) => compareIds(resourceNode.id, params.id));

  if (!node) throw new Response("Not found", { status: 404 });
  if (node.type !== "file" || !node.file?.blob?.url) {
    throw new Response("Not found", { status: 404 });
  }

  return { template, node };
}

function Page() {
  const { template, node } = Pages.useLoadedData<LoadedData>();
  const paths = usePaths();
  const formattedTimePreferences = useFormattedTimePreferences();
  const { mentionedPersonLookup } = useRichEditorHandlers({ scope: { type: "space", id: template.space.id } });
  const file = node.file!;
  const blob = file.blob!;
  const [downloadFile] = useDownloadFile(blob.url!, file.name);

  return (
    <FilePage
      pageTitle={[file.name, template.name]}
      navigation={navigation(template, paths)}
      options={[
        {
          type: "action",
          icon: IconDownload,
          label: "Download",
          onClick: downloadFile,
          testId: "download-file-link",
        },
      ]}
      testId="project-template-file-page"
      title={file.name}
      author={file.author ?? null}
      postedAt={file.insertedAt}
      formattedTimePreferences={formattedTimePreferences}
      filename={blob.filename || file.name}
      fileSize={findFileSize(blob.size ?? 0)}
      viewUrl={blob.url!}
      onDownload={downloadFile}
      blob={{
        url: blob.url!,
        contentType: blob.contentType,
        width: blob.width,
        height: blob.height,
      }}
      description={file.description ?? null}
      mentionedPersonLookup={mentionedPersonLookup}
      hideReactions
      hideComments
      hideSubscriptions
      hideDeleteModal
    />
  );
}

function navigation(template: ProjectTemplate, paths: Paths) {
  return [
    { to: paths.spacePath(template.space.id), label: template.space.name },
    { to: paths.spaceProjectTemplatesPath(template.space.id), label: "Project Templates" },
    { to: paths.projectTemplatePath(template.id), label: template.name },
    { to: paths.projectTemplatePath(template.id, { tab: "docs-and-files" }), label: "Docs & Files" },
  ];
}
