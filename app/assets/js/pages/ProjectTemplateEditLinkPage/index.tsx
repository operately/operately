import { useTranslation } from "react-i18next";
import i18n from "@/i18n";
import { useUpdateTemplateLink } from "@/models/projectTemplates/projectTemplateEditorLifecycle";
import { loader, useLoadedData } from "./loader";
import { useRichEditorHandlers } from "@/hooks/useRichEditorHandlers";
import { buildProjectTemplateResourceNavigation } from "@/models/projectTemplates/pageNavigation";
import { usePaths } from "@/routes/paths";
import type { PageModule } from "@/routes/types";
import { LinkEditPage, emptyContent, showErrorToast, type LinkEditPageTypes } from "turboui";

import { useNavigate } from "react-router";
import React from "react";

export default { name: "ProjectTemplateEditLinkPage", loader, Page } as PageModule;

function Page() {
  const { t } = useTranslation();
  const { template, node } = useLoadedData();
  const updateLinkMutation = useUpdateTemplateLink({ templateId: template.id, spaceId: template.space.id });
  const paths = usePaths();
  const navigate = useNavigate();
  const link = node.link;
  const richTextHandlers = useRichEditorHandlers({ scope: { type: "space", id: template.space.id } });
  const cancelLink = paths.projectTemplateLinkPath(template.id, node.id);
  const initialDescription = link.description ? JSON.parse(link.description) : emptyContent();

  async function handleSubmit(values: LinkEditPageTypes.Values, meta: { contentChanged: boolean }) {
    try {
      if (meta.contentChanged) {
        await updateLinkMutation.mutateAsync({
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
      showErrorToast(i18n.t("Link not updated"), i18n.t("Check the form and try again."));
      return false;
    }
  }

  return (
    <LinkEditPage
      pageTitle={[t("Edit Link"), template.name]}
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
