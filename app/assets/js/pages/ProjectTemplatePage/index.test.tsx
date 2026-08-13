import Api, { type ProjectTemplateResourceNode } from "@/api";
import { uploadFilesWithPreviews } from "@/models/blobs";
import { redirectIfFeatureNotEnabled } from "@/routes/redirectUtils";
import { loader } from "./loader";
import { activePersonIds } from "./people";
import {
  createFilesUploadOperation,
  createFolderOperation,
  createFolderRenameOperation,
  createPeopleOperations,
  createResourceDeleteOperation,
  createResourceMoveOperation,
  createTaskMove,
  toResourceNode,
} from ".";
import type { AddFileUploadItem } from "turboui";

jest.mock("@/components/Pages", () => ({}));
jest.mock("@/hooks/useRichEditorHandlers", () => ({ useRichEditorHandlers: jest.fn() }));
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
      get: jest.fn(),
      updateTask: jest.fn(),
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

jest.mock("@/routes/redirectUtils", () => ({ redirectIfFeatureNotEnabled: jest.fn() }));

const getTemplate = Api.project_templates.get as jest.Mock;
const updateTask = Api.project_templates.updateTask as jest.Mock;
const createPerson = Api.project_templates.createPerson as jest.Mock;
const updatePerson = Api.project_templates.updatePerson as jest.Mock;
const deletePerson = Api.project_templates.deletePerson as jest.Mock;
const createFolder = Api.project_templates.createFolder as jest.Mock;
const createFiles = Api.project_templates.createFiles as jest.Mock;
const deleteResource = Api.project_templates.deleteResource as jest.Mock;
const moveResource = Api.project_templates.moveResource as jest.Mock;
const updateFolder = Api.project_templates.updateFolder as jest.Mock;
const uploadSelectedFiles = uploadFilesWithPreviews as jest.Mock;
const featureRedirect = redirectIfFeatureNotEnabled as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  featureRedirect.mockResolvedValue(undefined);
});

test("loads the complete template graph for the editor", async () => {
  const template = { id: "template-1", milestones: [{ id: "milestone-1" }], tasks: [{ id: "task-1" }] };
  getTemplate.mockResolvedValue({ template });

  await expect(loader({ params: { companyId: "acme", id: "template-1" } } as any)).resolves.toEqual({ template });
  expect(featureRedirect).toHaveBeenCalledWith(
    { companyId: "acme", id: "template-1" },
    { feature: "project_templates", path: "/acme" },
  );
  expect(getTemplate).toHaveBeenCalledWith({ id: "template-1" });
});

test("redirects home before loading the template when the feature is disabled", async () => {
  featureRedirect.mockRejectedValue(new Error("redirect"));

  await expect(loader({ params: { companyId: "acme", id: "template-1" } } as any)).rejects.toThrow("redirect");

  expect(getTemplate).not.toHaveBeenCalled();
});

test("sends only available people when replacing task assignees", () => {
  expect(
    activePersonIds([
      {
        id: "template-person-1",
        person: { id: "person-1", fullName: "Ada", avatarUrl: null },
        role: "contributor",
        responsibility: null,
        accessLevel: 70,
        active: true,
      },
      {
        id: "template-person-2",
        person: { id: "person-2", fullName: "Bob", avatarUrl: null },
        role: "contributor",
        responsibility: null,
        accessLevel: 70,
        active: false,
      },
    ]),
  ).toEqual(["person-1"]);
});

test("moves a task with its destination milestone and index in one request", async () => {
  updateTask.mockResolvedValue({ task: { id: "task-1" } });
  const mutate = jest.fn(async (_message: string, operation: () => Promise<unknown>) => {
    await operation();
    return true;
  });
  const moveTask = createTaskMove({ templateId: "template-1", mutate });

  await expect(moveTask("task-1", "milestone-2", 3)).resolves.toBe(true);

  expect(updateTask).toHaveBeenCalledWith({
    templateId: "template-1",
    taskId: "task-1",
    milestoneId: "milestone-2",
    index: 3,
  });
});

test("returns false when a task move fails", async () => {
  const mutate = jest.fn().mockResolvedValue(false);
  const moveTask = createTaskMove({ templateId: "template-1", mutate });

  await expect(moveTask("task-1", null, 0)).resolves.toBe(false);
});

test("deletes a template resource by node id", async () => {
  deleteResource.mockResolvedValue({ success: true });
  const mutate = jest.fn(async (_message: string, operation: () => Promise<unknown>) => {
    await operation();
    return true;
  });
  const deleteTemplateResource = createResourceDeleteOperation({ templateId: "template-1", mutate });

  await expect(deleteTemplateResource("node-1")).resolves.toBe(true);

  expect(deleteResource).toHaveBeenCalledWith({
    templateId: "template-1",
    nodeId: "node-1",
  });
});

test("creates a template folder in the selected parent", async () => {
  createFolder.mockResolvedValue({ folder: { id: "folder-1" } });
  const mutate = jest.fn(async (_message: string, operation: () => Promise<unknown>) => {
    await operation();
    return true;
  });
  const createFolderForTemplate = createFolderOperation({ templateId: "template-1", mutate });

  await expect(createFolderForTemplate("parent-folder-1", "Launch assets")).resolves.toBe(true);

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
  const mutate = jest.fn(async (_message: string, operation: () => Promise<unknown>) => {
    await operation();
    return true;
  });
  uploadSelectedFiles.mockImplementation(async ({ persist }) => persist(uploadedFiles));
  createFiles.mockResolvedValue({ files: [{ id: "file-1" }] });
  const uploadTemplateFiles = createFilesUploadOperation({
    templateId: "template-1",
    mutate,
  });

  await expect(uploadTemplateFiles(selectedItems, setProgress, "folder-1")).resolves.toBe(true);

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
  const mutate = jest.fn(async (_message: string, operation: () => Promise<unknown>) => {
    await operation();
    return true;
  });
  const moveTemplateResource = createResourceMoveOperation({ templateId: "template-1", mutate });

  await expect(moveTemplateResource("node-1", "folder-1")).resolves.toBe(true);

  expect(moveResource).toHaveBeenCalledWith({
    templateId: "template-1",
    nodeId: "node-1",
    parentFolderId: "folder-1",
  });
});

test("moves a template resource to the Docs & Files root", async () => {
  moveResource.mockResolvedValue({ success: true });
  const mutate = jest.fn(async (_message: string, operation: () => Promise<unknown>) => {
    await operation();
    return true;
  });
  const moveTemplateResource = createResourceMoveOperation({ templateId: "template-1", mutate });

  await expect(moveTemplateResource("node-1", null)).resolves.toBe(true);

  expect(moveResource).toHaveBeenCalledWith({
    templateId: "template-1",
    nodeId: "node-1",
    parentFolderId: null,
  });
});

test("renames a template folder", async () => {
  updateFolder.mockResolvedValue({ folder: { id: "folder-1", name: "Campaign assets" } });
  const mutate = jest.fn(async (_message: string, operation: () => Promise<unknown>) => {
    await operation();
    return true;
  });
  const renameTemplateFolder = createFolderRenameOperation({ templateId: "template-1", mutate });

  await expect(renameTemplateFolder("folder-1", "Campaign assets")).resolves.toBe(true);

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

test("serializes contributor create, update, replacement, and deletion mutations", async () => {
  createPerson.mockResolvedValue({ person: { id: "template-person-1" } });
  updatePerson.mockResolvedValue({ person: { id: "template-person-1" } });
  deletePerson.mockResolvedValue({ success: true });
  const mutate = jest.fn(async (_message: string, operation: () => Promise<unknown>) => {
    await operation();
    return true;
  });
  const people = createPeopleOperations({ templateId: "template-1", mutate });
  const replacement = { id: "person-2", fullName: "Emily Davis", avatarUrl: null };

  await expect(
    people.onPersonCreate({
      person: replacement,
      role: "contributor",
      responsibility: "Coordinates launch support",
      accessLevel: 70,
    }),
  ).resolves.toBe(true);
  await expect(
    people.onPersonUpdate("template-person-1", {
      person: replacement,
      role: "contributor",
      responsibility: "Coordinates launch support",
      accessLevel: 70,
    }),
  ).resolves.toBe(true);
  await expect(people.onPersonDelete("template-person-1")).resolves.toBe(true);

  expect(createPerson).toHaveBeenCalledWith({
    templateId: "template-1",
    personId: "person-2",
    role: "contributor",
    responsibility: "Coordinates launch support",
    accessLevel: 70,
  });
  expect(updatePerson).toHaveBeenCalledWith({
    templateId: "template-1",
    templatePersonId: "template-person-1",
    personId: "person-2",
    role: "contributor",
    responsibility: "Coordinates launch support",
    accessLevel: 70,
  });
  expect(deletePerson).toHaveBeenCalledWith({ templateId: "template-1", templatePersonId: "template-person-1" });
});

test("returns false from contributor mutations without invoking their operations", async () => {
  const mutate = jest.fn().mockResolvedValue(false);
  const people = createPeopleOperations({ templateId: "template-1", mutate });

  await expect(people.onPersonUpdate("template-person-1", { responsibility: "Updated" })).resolves.toBe(false);
  await expect(people.onPersonDelete("template-person-1")).resolves.toBe(false);
  expect(people.onPersonCreate({ person: null, role: "contributor", responsibility: null, accessLevel: 70 })).toBe(
    false,
  );
});
