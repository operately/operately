import Api, { type ProjectTemplate, type ProjectTemplateResourceNode } from "@/api";
import * as Pages from "@/components/Pages";
import { useFormattedTimePreferences } from "@/hooks/useFormattedTimePreferences";
import { useRichEditorHandlers } from "@/hooks/useRichEditorHandlers";
import { redirectIfFeatureNotEnabled } from "@/routes/redirectUtils";
import { compareIds, Paths, usePaths } from "@/routes/paths";
import type { PageModule } from "@/routes/types";
import { DocumentPage } from "turboui";
import React from "react";

export default { name: "ProjectTemplateDocumentPage", loader, Page } as PageModule;

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
  if (node.type !== "document" || !node.document) {
    throw new Response("Not found", { status: 404 });
  }

  return { template, node };
}

export function Page() {
  const { template, node } = Pages.useLoadedData<LoadedData>();
  const paths = usePaths();
  const formattedTimePreferences = useFormattedTimePreferences();
  const { mentionedPersonLookup } = useRichEditorHandlers({ scope: { type: "space", id: template.space.id } });
  const document = node.document!;

  return (
    <DocumentPage
      pageTitle={[document.name, template.name]}
      navigation={navigation(template, paths)}
      testId="project-template-document-page"
      title={document.name}
      author={document.author ?? null}
      state="published"
      publishedAt={document.insertedAt}
      modifiedAt={document.updatedAt}
      formattedTimePreferences={formattedTimePreferences}
      content={document.content}
      mentionedPersonLookup={mentionedPersonLookup}
      hideDraftActions
      hideReactions
      hideComments
      hideSubscriptions
      hideCopyModal
      hideDeleteModal
    />
  );
}

function navigation(template: ProjectTemplate, paths: Paths) {
  return [
    { to: paths.spacePath(template.space.id), label: template.space.name },
    { to: paths.spaceProjectTemplatesPath(template.space.id), label: "Project Templates" },
    { to: paths.projectTemplatePath(template.id), label: template.name },
    { to: paths.projectTemplatePath(template.id) + "?tab=docs-and-files", label: "Docs & Files" },
  ];
}
