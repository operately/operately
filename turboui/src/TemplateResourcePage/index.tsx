import React from "react";

import { DocsAndFilesTab } from "../DocsAndFiles";
import { DivLink } from "../Link";
import { Page } from "../Page";
import type { Navigation } from "../Page/Navigation";
import RichContent from "../RichContent";
import type { RichEditorHandlers } from "../RichEditor/useEditor";

export namespace TemplateResourcePage {
  export interface Item {
    id: string;
    name: string;
    type: "folder" | "document" | "file" | "link";
    link: string;
    insertedAt: string;
    updatedAt: string;
  }

  export interface Resource {
    name: string;
    type: Item["type"];
    content?: any;
    url?: string;
    downloadUrl?: string;
    items?: Item[];
  }

  export interface Props {
    pageTitle: Page.Props["title"];
    navigation: Navigation.Item[];
    resource: Resource;
    richTextHandlers: RichEditorHandlers;
  }
}

export function TemplateResourcePage(props: TemplateResourcePage.Props) {
  return (
    <Page title={props.pageTitle} navigation={props.navigation} testId="template-resource-page">
      <main className="px-8 py-6 sm:px-10 sm:py-8">
        {props.resource.type === "folder" ? (
          <DocsAndFilesTab
            title={props.resource.name}
            items={props.resource.items ?? []}
            emptyStateKind="folder"
            className="max-w-6xl"
          />
        ) : (
          <ResourceContent resource={props.resource} richTextHandlers={props.richTextHandlers} />
        )}
      </main>
    </Page>
  );
}

function ResourceContent({
  resource,
  richTextHandlers,
}: {
  resource: TemplateResourcePage.Resource;
  richTextHandlers: RichEditorHandlers;
}) {
  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-2xl font-bold text-content-accent">{resource.name}</h1>

      {resource.type === "document" && resource.content && (
        <div className="my-8">
          <RichContent content={resource.content} mentionedPersonLookup={richTextHandlers.mentionedPersonLookup} />
        </div>
      )}

      {resource.type === "link" && resource.url && (
        <DivLink to={resource.url} external target="_blank" className="mt-6 inline-block font-medium text-link-base underline">
          Open link
        </DivLink>
      )}

      {resource.type === "file" && resource.downloadUrl && (
        <a href={resource.downloadUrl} className="mt-6 inline-block font-medium text-link-base underline" download>
          Download file
        </a>
      )}
    </div>
  );
}
