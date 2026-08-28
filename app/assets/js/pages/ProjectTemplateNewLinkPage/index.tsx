import Api, { type ProjectTemplate } from "@/api";
import * as Pages from "@/components/Pages";
import { useRichEditorHandlers } from "@/hooks/useRichEditorHandlers";
import { buildProjectTemplateResourceNavigation } from "@/models/projectTemplates/pageNavigation";
import { usePaths } from "@/routes/paths";
import type { PageModule } from "@/routes/types";
import { LinkNewPage, showErrorToast, type ResourceHubLinkType } from "turboui";
import type { LinkNewPage as LinkNewPageTypes } from "turboui/LinkNewPage/types";
import { useNavigate } from "react-router";
import React from "react";

export default { name: "ProjectTemplateNewLinkPage", loader, Page } as PageModule;

interface LoadedData {
  template: ProjectTemplate;
  parentFolderId: string | undefined;
  linkType: ResourceHubLinkType;
}

async function loader({ params, request }): Promise<LoadedData> {

  const url = new URL(request.url);
  const parentFolderId = url.searchParams.get("folderId") || undefined;
  const linkType = (url.searchParams.get("type") || "other") as ResourceHubLinkType;
  const { template } = await Api.project_templates.get({ id: params.templateId });

  return { template, parentFolderId, linkType };
}

function Page() {
  const { template, parentFolderId, linkType } = Pages.useLoadedData<LoadedData>();
  const paths = usePaths();
  const navigate = useNavigate();
  const richTextHandlers = useRichEditorHandlers({ scope: { type: "space", id: template.space.id } });
  const docsAndFilesLink = paths.projectTemplatePath(template.id, { tab: "docs-and-files", folderId: parentFolderId });

  async function createLink(values: LinkNewPageTypes.Values) {
    try {
      const result = await Api.project_templates.createLink({
        templateId: template.id,
        parentFolderId,
        name: values.title,
        url: values.link,
        type: values.type || "other",
        description: JSON.stringify(values.description),
      });
      navigate(paths.projectTemplateLinkPath(template.id, result.link.nodeId));
      return true;
    } catch {
      showErrorToast("Link not created", "Check the form and try again.");
      return false;
    }
  }

  return (
    <LinkNewPage
      pageTitle={["New Link", template.name]}
      navigation={buildProjectTemplateResourceNavigation(template, paths, { parentFolderId })}
      testId="project-template-new-link-page"
      richTextHandlers={richTextHandlers}
      initialType={linkType}
      cancelLink={docsAndFilesLink}
      hideSubscriptions
      onSubmit={createLink}
    />
  );
}

