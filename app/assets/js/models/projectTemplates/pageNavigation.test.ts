import { buildProjectTemplateResourceNavigation } from "./pageNavigation";
import { Paths } from "@/routes/paths";
import type { ProjectTemplate, ProjectTemplateResourceNode } from "@/api";

const paths = new Paths({ companyId: "acme" });

describe("buildProjectTemplateResourceNavigation", () => {
  it("stops at Docs & Files when the resource is at the hub root", () => {
    expect(buildProjectTemplateResourceNavigation(template(), paths, { parentFolderId: null })).toEqual([
      { to: "/acme/spaces/space-1", label: "Product Space" },
      { to: "/acme/spaces/space-1/project-templates", label: "Project Templates" },
      { to: "/acme/project-templates/template-1", label: "Launch kit" },
      { to: "/acme/project-templates/template-1?tab=docs-and-files", label: "Docs & Files" },
    ]);
  });

  it("appends nested folder ancestors after Docs & Files", () => {
    expect(
      buildProjectTemplateResourceNavigation(template(), paths, {
        parentFolderId: "nested-folder",
      }),
    ).toEqual([
      { to: "/acme/spaces/space-1", label: "Product Space" },
      { to: "/acme/spaces/space-1/project-templates", label: "Project Templates" },
      { to: "/acme/project-templates/template-1", label: "Launch kit" },
      { to: "/acme/project-templates/template-1?tab=docs-and-files", label: "Docs & Files" },
      { to: "/acme/project-templates/template-1?tab=docs-and-files&folderId=assets", label: "Assets" },
      { to: "/acme/project-templates/template-1?tab=docs-and-files&folderId=nested-folder", label: "Checklists" },
    ]);
  });

  it("appends the current resource after folder ancestors on edit pages", () => {
    expect(
      buildProjectTemplateResourceNavigation(template(), paths, {
        parentFolderId: "assets",
        current: { to: "/acme/project-templates/template-1/documents/doc-1", label: "Launch plan" },
      }),
    ).toEqual([
      { to: "/acme/spaces/space-1", label: "Product Space" },
      { to: "/acme/spaces/space-1/project-templates", label: "Project Templates" },
      { to: "/acme/project-templates/template-1", label: "Launch kit" },
      { to: "/acme/project-templates/template-1?tab=docs-and-files", label: "Docs & Files" },
      { to: "/acme/project-templates/template-1?tab=docs-and-files&folderId=assets", label: "Assets" },
      { to: "/acme/project-templates/template-1/documents/doc-1", label: "Launch plan" },
    ]);
  });
});

function template(): ProjectTemplate {
  return {
    id: "template-1",
    name: "Launch kit",
    space: { id: "space-1", name: "Product Space" },
    resourceNodes: [folderNode("assets", "Assets", null), folderNode("nested-folder", "Checklists", "assets")],
  } as ProjectTemplate;
}

function folderNode(id: string, name: string, parentFolderId: string | null): ProjectTemplateResourceNode {
  return {
    id: `${id}-node`,
    projectTemplateId: "template-1",
    parentFolderId,
    type: "folder",
    position: 0,
    folder: { id, nodeId: `${id}-node`, name, insertedAt: "", updatedAt: "" },
    insertedAt: "",
    updatedAt: "",
  } as ProjectTemplateResourceNode;
}
