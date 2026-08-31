import Api, { type ProjectTemplate, type ProjectTemplateResourceNode } from "@/api";
import * as Pages from "@/components/Pages";
import { useRichEditorHandlers } from "@/hooks/useRichEditorHandlers";
import { buildProjectTemplateResourceNavigation } from "@/models/projectTemplates/pageNavigation";
import { compareIds, usePaths } from "@/routes/paths";
import type { PageModule } from "@/routes/types";
import { LinkEditPage, emptyContent, showErrorToast } from "turboui";
import type { LinkEditPage as LinkEditPageTypes } from "turboui/LinkEditPage/types";
import { useNavigate } from "react-router";
import React from "react";

export default { name: "ProjectTemplateEditLinkPage", loader, Page } as PageModule;

interface LoadedData {
  template: ProjectTemplate;
  node: ProjectTemplateResourceNode;
}

async function loader({ params }): Promise<LoadedData> {
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
  const navigate = useNavigate();
  const link = node.link!;
  const richTextHandlers = useRichEditorHandlers({ scope: { type: "space", id: template.space.id } });
  const cancelLink = paths.projectTemplateLinkPath(template.id, node.id);
  const initialDescription = link.description ? JSON.parse(link.description) : emptyContent();

  async function handleSubmit(values: LinkEditPageTypes.Values, meta: { contentChanged: boolean }) {
    try {
      if (meta.contentChanged) {
        await Api.project_templates.updateLink({
          templateId: template.id,
          linkId: link.id,
          name: values.title,
          url: values.url,
          description: JSON.stringify(values.description),
          type: link.type,
        });
      }
      navigate(cancelLink);
      return true;
    } catch {
      showErrorToast("Link not updated", "Check the form and try again.");
      return false;
    }
  }

  return (
    <LinkEditPage
      pageTitle={["Edit Link", template.name]}
      navigation={buildProjectTemplateResourceNavigation(template, paths, {
        parentFolderId: node.parentFolderId,
        current: { to: cancelLink, label: link.name },
      })}
      testId="project-template-edit-link-page"
      richTextHandlers={richTextHandlers}
      initialTitle={link.name}
      initialUrl={link.url}
      initialDescription={initialDescription}
      cancelLink={cancelLink}
      onSubmit={handleSubmit}
    />
  );
}
