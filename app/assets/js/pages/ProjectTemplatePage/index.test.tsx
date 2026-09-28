/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import Api, { type ProjectTemplateResourceNode } from "@/api";
import { uploadFilesWithPreviews } from "@/models/blobs";
import { useRefresh } from "./loader";
import { useTemplateResources, toResourceNode } from ".";
import { act, renderHook } from "@/__tests__/renderHook";
import { showErrorToast } from "turboui";
import type { AddFileUploadItem } from "turboui";

jest.mock("react-router", () => ({}));
jest.mock("./loader", () => ({ useRefresh: jest.fn() }));
jest.mock("@/hooks/useRichTextHandlers", () => ({ useRichTextHandlers: jest.fn() }));
jest.mock("@/models/people", () => ({}));
jest.mock("@/models/tasks", () => ({}));
jest.mock("@/models/blobs", () => ({
  findFileSize: jest.fn(),
  uploadFilesWithPreviews: jest.fn(),
}));
jest.mock("@/routes/paths", () => ({
  Paths: { companyHomePath: (companyId: string) => `/${companyId}` },
  usePaths: jest.fn(),
}));
jest.mock("turboui", () => ({
  parseContent: jest.fn(),
  showErrorToast: jest.fn(),
  TemplateProjectPage: jest.fn(),
}));

jest.mock("@/api", () => ({
  __esModule: true,
  default: {
    project_templates: {
      getQuery: jest.fn(),
      createPerson: jest.fn(),
      updatePerson: jest.fn(),
      deletePerson: jest.fn(),
      createFolder: jest.fn(),
      createFiles: jest.fn(),
      deleteResource: jest.fn(),
      moveResource: jest.fn(),
      updateFolder: jest.fn(),
    },
  },
}));

jest.mock("@/models/projectTemplates/projectTemplateEditorLifecycle", () => {
  const api = jest.requireMock("@/api").default.project_templates;
  return {
    useCreateTemplateFolder: () => ({ mutateAsync: api.createFolder }),
    useUpdateTemplateFolder: () => ({ mutateAsync: api.updateFolder }),
    useDeleteTemplateResource: () => ({ mutateAsync: api.deleteResource }),
    useMoveTemplateResource: () => ({ mutateAsync: api.moveResource }),
    useCreateTemplateFiles: () => ({ mutateAsync: api.createFiles }),
  };
});

function setup() {
  const template = { id: "template-1", space: { id: "space-1" } } as Parameters<typeof useTemplateResources>[0];
  const { result } = renderHook(() => useTemplateResources(template), { initialProps: undefined });

  return async (action: (resources: ReturnType<typeof useTemplateResources>) => Promise<boolean>) => {
    let saved = false;
    await act(async () => {
      saved = await action(result.current);
    });
    return saved;
  };
}

const createFolder = Api.project_templates.createFolder as jest.Mock;
const createFiles = Api.project_templates.createFiles as jest.Mock;
const deleteResource = Api.project_templates.deleteResource as jest.Mock;
const moveResource = Api.project_templates.moveResource as jest.Mock;
const updateFolder = Api.project_templates.updateFolder as jest.Mock;
const uploadSelectedFiles = uploadFilesWithPreviews as jest.Mock;

beforeEach(() => {
  jest.resetAllMocks();
  jest.mocked(useRefresh).mockReturnValue(jest.fn().mockResolvedValue(undefined));
});

test("deletes a template resource by node id", async () => {
  deleteResource.mockResolvedValue({ success: true });
  const run = setup();

  await expect(run((resources) => resources.onResourceDelete("node-1"))).resolves.toBe(true);

  expect(deleteResource).toHaveBeenCalledWith({
    templateId: "template-1",
    nodeId: "node-1",
  });
});

test("creates a template folder in the selected parent", async () => {
  createFolder.mockResolvedValue({ folder: { id: "folder-1" } });
  const run = setup();

  await expect(run((resources) => resources.onFolderCreate("parent-folder-1", "Launch assets"))).resolves.toBe(true);

  expect(createFolder).toHaveBeenCalledWith({
    templateId: "template-1",
    parentFolderId: "parent-folder-1",
    name: "Launch assets",
  });
});

test("uploads blobs and creates template files in one batch", async () => {
  const uploadedFiles = [
    {
      name: "Launch-plan.pdf",
      description: { type: "doc", content: [] },
      blobId: "blob-1",
      previewBlobId: "preview-1",
    },
  ];
  const selectedItems: AddFileUploadItem[] = [
    {
      name: "Launch-plan",
      nameWithExtension: "Launch-plan.pdf",
      extension: "pdf",
      description: { type: "doc", content: [] },
      mainFile: new File(["plan"], "Launch-plan.pdf", { type: "application/pdf" }),
      fileType: "pdf",
    },
  ];
  const setProgress = jest.fn();
  uploadSelectedFiles.mockImplementation(async ({ persist }) => persist(uploadedFiles));
  createFiles.mockResolvedValue({ files: [{ id: "file-1" }] });
  const run = setup();

  await expect(run((resources) => resources.onFilesUpload(selectedItems, setProgress, "folder-1"))).resolves.toBe(true);

  expect(uploadSelectedFiles).toHaveBeenCalledWith({
    items: selectedItems,
    setProgress,
    persist: expect.any(Function),
  });
  expect(createFiles).toHaveBeenCalledWith({
    templateId: "template-1",
    parentFolderId: "folder-1",
    files: [
      {
        ...uploadedFiles[0],
        description: JSON.stringify(uploadedFiles[0]!.description),
      },
    ],
  });
});

test("moves a template resource to the selected folder", async () => {
  moveResource.mockResolvedValue({ success: true });
  const run = setup();

  await expect(run((resources) => resources.onResourceMove("node-1", "folder-1"))).resolves.toBe(true);

  expect(moveResource).toHaveBeenCalledWith({
    templateId: "template-1",
    nodeId: "node-1",
    parentFolderId: "folder-1",
  });
});

test("moves a template resource to the Docs & Files root", async () => {
  moveResource.mockResolvedValue({ success: true });
  const run = setup();

  await expect(run((resources) => resources.onResourceMove("node-1", null))).resolves.toBe(true);

  expect(moveResource).toHaveBeenCalledWith({
    templateId: "template-1",
    nodeId: "node-1",
    parentFolderId: null,
  });
});

test("renames a template folder", async () => {
  updateFolder.mockResolvedValue({ folder: { id: "folder-1", name: "Campaign assets" } });
  const run = setup();

  await expect(run((resources) => resources.onFolderRename("folder-1", "Campaign assets"))).resolves.toBe(true);

  expect(updateFolder).toHaveBeenCalledWith({
    templateId: "template-1",
    folderId: "folder-1",
    name: "Campaign assets",
  });
});

test("maps a template folder node to its folder id", () => {
  const node: ProjectTemplateResourceNode = {
    __typename: "project_template_resource_node",
    id: "node-1",
    projectTemplateId: "template-1",
    parentFolderId: null,
    type: "folder",
    position: 0,
    folder: {
      __typename: "project_template_resource_folder",
      id: "folder-1",
      nodeId: "node-1",
      name: "Assets",
      insertedAt: "2026-08-12T12:00:00Z",
      updatedAt: "2026-08-12T12:00:00Z",
    },
    insertedAt: "2026-08-12T12:00:00Z",
    updatedAt: "2026-08-12T12:00:00Z",
  };

  expect(toResourceNode(node, "#")).toEqual([
    expect.objectContaining({
      id: "node-1",
      folderId: "folder-1",
      type: "folder",
      name: "Assets",
    }),
  ]);
});

test("maps a template image file to its preview thumbnail", () => {
  const node: ProjectTemplateResourceNode = {
    __typename: "project_template_resource_node",
    id: "node-1",
    projectTemplateId: "template-1",
    parentFolderId: null,
    type: "file",
    position: 0,
    file: {
      __typename: "project_template_resource_file",
      id: "file-1",
      nodeId: "node-1",
      name: "Launch.png",
      blob: {
        __typename: "blob",
        id: "blob-1",
        contentType: "image/png",
        width: 1200,
        height: 800,
        url: "/blobs/blob-1",
      },
      previewBlob: {
        __typename: "blob",
        id: "preview-1",
        contentType: "image/png",
        width: 100,
        height: 67,
        url: "/blobs/preview-1",
      },
      insertedAt: "2026-08-12T12:00:00Z",
      updatedAt: "2026-08-12T12:00:00Z",
    },
    insertedAt: "2026-08-12T12:00:00Z",
    updatedAt: "2026-08-12T12:00:00Z",
  };

  expect(toResourceNode(node, "/templates/template-1/files/node-1")).toEqual([
    expect.objectContaining({
      fileKind: "image",
      thumbnail: {
        url: "/blobs/preview-1",
        alt: "Launch.png",
        width: 100,
        height: 67,
      },
    }),
  ]);
});

test("reports a failed resource write without refreshing", async () => {
  deleteResource.mockRejectedValueOnce(new Error("Offline"));
  const run = setup();

  await expect(run((resources) => resources.onResourceDelete("node-1"))).resolves.toBe(false);

  expect(showErrorToast).toHaveBeenCalled();
  expect(jest.mocked(useRefresh).mock.results[0]?.value).not.toHaveBeenCalled();
});

test("waits for a successful folder write and refresh before completing", async () => {
  createFolder.mockResolvedValue({ folder: { id: "folder-1" } });
  let finishRefresh = () => {};
  const refresh = jest.fn(
    () =>
      new Promise<void>((resolve) => {
        finishRefresh = resolve;
      }),
  );
  jest.mocked(useRefresh).mockReturnValue(refresh);
  const run = setup();
  let completed = false;

  const saving = run((resources) => resources.onFolderCreate(null, "Assets")).then(() => {
    completed = true;
  });
  await Promise.resolve();
  await Promise.resolve();
  expect(refresh).toHaveBeenCalled();
  expect(completed).toBe(false);

  finishRefresh();
  await saving;
  expect(completed).toBe(true);
});
