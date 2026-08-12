import Api, { type ProjectTemplate, type ProjectTemplateResourceNode } from "@/api";
import * as Pages from "@/components/Pages";
import { useFormattedTimePreferences } from "@/hooks/useFormattedTimePreferences";
import { useRichEditorHandlers } from "@/hooks/useRichEditorHandlers";
import { redirectIfFeatureNotEnabled } from "@/routes/redirectUtils";
import { compareIds, Paths, usePaths } from "@/routes/paths";
import type { PageModule } from "@/routes/types";
import { IconEdit, LinkPage, type ResourceHubLinkType } from "turboui";
import React from "react";

export default { name: "ProjectTemplateLinkPage", loader, Page } as PageModule;

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
  if (node.type !== "link" || !node.link) {
    throw new Response("Not found", { status: 404 });
  }

  return { template, node };
}

function Page() {
  const { template, node } = Pages.useLoadedData<LoadedData>();
  const paths = usePaths();
  const formattedTimePreferences = useFormattedTimePreferences();
  const { mentionedPersonLookup } = useRichEditorHandlers({ scope: { type: "space", id: template.space.id } });
  const link = node.link!;

  return (
    <LinkPage
      pageTitle={[link.name, template.name]}
      navigation={navigation(template, paths)}
      options={[
        {
          type: "link",
          icon: IconEdit,
          label: "Edit",
          link: paths.projectTemplateEditLinkPath(template.id, node.id),
          keepOutsideOnBigScreen: true,
          testId: "edit-link-link",
        },
      ]}
      testId="project-template-link-page"
      linkType={link.type as ResourceHubLinkType}
      title={link.name}
      url={link.url}
      author={link.author ?? null}
      postedAt={link.insertedAt}
      formattedTimePreferences={formattedTimePreferences}
      description={link.description ?? null}
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
