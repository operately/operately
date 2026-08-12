import React from "react";
import { useNavigate } from "react-router";

import { links } from "@/models/resourceHubs";
import { useRichEditorHandlers } from "@/hooks/useRichEditorHandlers";
import { usePaths } from "@/routes/paths";
import { assertPresent } from "@/utils/assertions";
import { LinkEditPage, showErrorToast } from "turboui";
import type { LinkEditPage as LinkEditPageTypes } from "turboui/LinkEditPage/types";

import { useLoadedData } from "./loader";
import { buildEditLinkPageNavigation } from "./navigation";

export function Page() {
  const { link } = useLoadedData();
  const paths = usePaths();
  const navigate = useNavigate();
  const [edit] = links.useUpdate();

  assertPresent(link.name, "name must be present in link");
  assertPresent(link.url, "url must be present in link");
  assertPresent(link.resourceHubId, "resourceHubId must be present in link");
  assertPresent(link.description, "description must be present in link");

  const richTextHandlers = useRichEditorHandlers({ scope: { type: "resource_hub", id: link.resourceHubId } });
  const cancelLink = paths.resourceHubLinkPath(link.id!);
  const initialDescription = JSON.parse(link.description);

  async function handleSubmit(values: LinkEditPageTypes.Values, meta: { contentChanged: boolean }) {
    try {
      if (meta.contentChanged) {
        await edit({
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
      pageTitle="Edit Link"
      navigation={buildEditLinkPageNavigation(link, paths)}
      testId="resource-hub-edit-link-page"
      richTextHandlers={richTextHandlers}
      initialTitle={link.name}
      initialUrl={link.url}
      initialDescription={initialDescription}
      cancelLink={cancelLink}
      onSubmit={handleSubmit}
    />
  );
}
