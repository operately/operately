import Api, { type ProjectTemplate, type ProjectTemplateResourceNode } from "@/api";
import * as Pages from "@/components/Pages";
import { useRichEditorHandlers } from "@/hooks/useRichEditorHandlers";
import { redirectIfFeatureNotEnabled } from "@/routes/redirectUtils";
import { Paths, usePaths } from "@/routes/paths";
import type { PageModule } from "@/routes/types";
import { TemplateResourcePage } from "turboui";
import React from "react";

export default { name: "ProjectTemplateResourcePage", loader, Page } as PageModule;

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
  const node = template.resourceNodes?.find((node) => node.id === params.nodeId);

  if (!node) throw new Response("Not found", { status: 404 });

  return { template, node };
}

function Page() {
  const { template, node } = Pages.useLoadedData<LoadedData>();
  const paths = usePaths();
  const richTextHandlers = useRichEditorHandlers({ scope: { type: "space", id: template.space.id } });
  const resource = resourceProps(template, node, paths);

  return (
    <TemplateResourcePage
      pageTitle={[resource.name, template.name]}
      navigation={navigation(template, paths)}
      resource={resource}
      richTextHandlers={richTextHandlers}
    />
  );
}

function resourceProps(
  template: ProjectTemplate,
  node: ProjectTemplateResourceNode,
  paths: Paths,
): TemplateResourcePage.Resource {
  const resource = node.folder ?? node.document ?? node.file ?? node.link;

  if (!resource) throw new Error("Template resource node has no resource content");

  if (node.type === "folder") {
    return {
      name: resource.name,
      type: "folder",
      items: (template.resourceNodes ?? [])
        .filter((child) => child.parentFolderId === node.folder?.id)
        .map((child) => itemProps(template, child, paths)),
    };
  }

  if (node.type === "document") {
    return { name: resource.name, type: "document", content: parseContent(node.document?.content) };
  }

  if (node.type === "file") {
    return { name: resource.name, type: "file", downloadUrl: node.file?.blob?.url ?? undefined };
  }

  return { name: resource.name, type: "link", url: node.link?.url };
}

function itemProps(
  template: ProjectTemplate,
  node: ProjectTemplateResourceNode,
  paths: Paths,
): TemplateResourcePage.Item {
  const resource = node.folder ?? node.document ?? node.file ?? node.link;

  if (!resource) throw new Error("Template resource node has no resource content");

  return {
    id: node.id,
    name: resource.name,
    type: node.type,
    link: paths.projectTemplateResourcePath(template.id, node.id),
    insertedAt: node.insertedAt,
    updatedAt: node.updatedAt,
  };
}

function navigation(template: ProjectTemplate, paths: Paths) {
  return [
    { to: paths.spacePath(template.space.id), label: template.space.name },
    { to: paths.spaceProjectTemplatesPath(template.space.id), label: "Project Templates" },
    { to: paths.projectTemplatePath(template.id), label: template.name },
    { to: paths.projectTemplatePath(template.id) + "?tab=docs-and-files", label: "Docs & Files" },
  ];
}

function parseContent(content: string | null | undefined): unknown {
  if (!content) return {};

  try {
    return JSON.parse(content);
  } catch {
    return {};
  }
}
