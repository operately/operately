import * as React from "react";

import { Page } from "../Page";
import {
  type AddFolderModalProps,
  resourceHubFolderNavigation,
  resourceHubPageNavigation,
  sortNodesWithFoldersFirst,
  type ResourceHub,
  type ResourceHubDocument,
  type ResourceHubFile,
  type ResourceHubFolder,
  type ResourceHubNode,
  type ResourceHubNodesListContextValue,
  type ResourceHubPermissions,
  type ResourceHubSortBy,
} from "../ResourceHub";
import { SubscribersSelector } from "../Subscriptions";
import { createMockRichEditorHandlers } from "../utils/storybook/richEditor";
import { asRichText } from "../utils/storybook/richContent";
import { genPeople } from "../utils/storybook/genPeople";

import type { SharedListPageProps } from "./SharedListPage";

const [author, reviewer, subscriber] = genPeople(3);

interface UseMockSharedListPagePropsArgs {
  parent: ResourceHub | ResourceHubFolder;
  parentType: "resource_hub" | "folder";
  nodes: ResourceHubNode[];
  onCreateFolder?: AddFolderModalProps["onCreateFolder"];
  onCreated?: () => void;
}

export function createMockPermissions(overrides: Partial<ResourceHubPermissions> = {}): ResourceHubPermissions {
  return {
    canCreateDocument: true,
    canCreateFile: true,
    canCreateFolder: true,
    canCreateLink: true,
    canView: true,
    ...overrides,
    __typename: "resource_hub_permissions",
  };
}

export function createMockResourceHub(overrides: Partial<ResourceHub> = {}): ResourceHub {
  return {
    id: "hub-1",
    name: "Engineering Handbook",
    space: { id: "space-1", name: "Operations" } as never,
    permissions: createMockPermissions(),
    ...overrides,
    __typename: "resource_hub",
  };
}

export function createMockFolder(overrides: Partial<ResourceHubFolder> = {}): ResourceHubFolder {
  const resourceHub = overrides.resourceHub ?? createMockResourceHub();

  return {
    id: "folder-1",
    resourceHubId: resourceHub.id,
    resourceHub,
    name: "Hiring Playbooks",
    permissions: createMockPermissions({ canRenameFolder: true }),
    pathToFolder: [],
    ...overrides,
    __typename: "resource_hub_folder",
  };
}

export function createMockDocumentNode(
  overrides: Omit<Partial<ResourceHubNode>, "document"> & { document?: Partial<ResourceHubDocument> } = {},
): ResourceHubNode {
  const { document: _documentOverride, ...nodeOverrides } = overrides;
  const document: Partial<ResourceHubDocument> = overrides.document ?? {};
  const documentId = document.id ?? "document-1";
  const documentData = {
    ...document,
    id: documentId,
    resourceHubId: document.resourceHubId ?? "hub-1",
    parentFolderId: document.parentFolderId ?? "folder-1",
    name: document.name ?? overrides.name ?? "Quarterly Planning Notes",
    content: document.content ?? JSON.stringify(asRichText("Plan summary for the next quarter.")),
    state: document.state ?? "published",
    author:
      document.author ??
      ({
        id: author?.id ?? "person-1",
        fullName: author?.fullName ?? "Alex Example",
        avatarUrl: author?.avatarUrl ?? null,
      } as never),
    __typename: "resource_hub_document" as const,
  } as ResourceHubDocument;

  return {
    ...nodeOverrides,
    id: overrides.id ?? `node-${documentId}`,
    name: overrides.name ?? "Quarterly Planning Notes",
    type: "document",
    document: documentData,
    __typename: "resource_hub_node",
  };
}

export function createMockDraftNode(
  overrides: Omit<Partial<ResourceHubNode>, "document"> & { document?: Partial<ResourceHubDocument> } = {},
): ResourceHubNode {
  return createMockDocumentNode({
    id: overrides.id ?? "node-draft-1",
    name: overrides.name ?? "Draft Interview Guide",
    document: {
      id: overrides.document?.id ?? "document-draft-1",
      name: overrides.document?.name ?? overrides.name ?? "Draft Interview Guide",
      state: "draft",
      ...overrides.document,
    },
    ...overrides,
  });
}

export function createMockFileNode(
  overrides: Omit<Partial<ResourceHubNode>, "file"> & { file?: Partial<ResourceHubFile> } = {},
): ResourceHubNode {
  const { file: _fileOverride, ...nodeOverrides } = overrides;
  const file: Partial<ResourceHubFile> = overrides.file ?? {};
  const fileId = file.id ?? "file-1";
  const fileData = {
    ...file,
    id: fileId,
    resourceHubId: file.resourceHubId ?? "hub-1",
    parentFolderId: file.parentFolderId ?? "folder-1",
    name: file.name ?? overrides.name ?? "Roadmap Screenshot",
    description: file.description ?? "Updated mockup from the planning session.",
    type: file.type ?? "image",
    blob:
      file.blob ??
      ({
        id: "blob-1",
        url: "/mock-roadmap.png",
        contentType: "image/png",
        width: 1280,
        height: 720,
      } as never),
    author:
      file.author ??
      ({
        id: reviewer?.id ?? "person-2",
        fullName: reviewer?.fullName ?? "Riley Example",
        avatarUrl: reviewer?.avatarUrl ?? null,
      } as never),
    __typename: "resource_hub_file" as const,
  } as ResourceHubFile;

  return {
    ...nodeOverrides,
    id: overrides.id ?? `node-${fileId}`,
    name: overrides.name ?? "Roadmap Screenshot",
    type: "file",
    file: fileData,
    __typename: "resource_hub_node",
  };
}

export function createMockFolderNode(
  overrides: Omit<Partial<ResourceHubNode>, "folder"> & { folder?: Partial<ResourceHubFolder> } = {},
): ResourceHubNode {
  const { folder: _folderOverride, ...nodeOverrides } = overrides;
  const folderId = overrides.folder?.id ?? "folder-node-1";
  const resourceHub = overrides.folder?.resourceHub ?? createMockResourceHub();
  const folderData = {
    ...overrides.folder,
    id: folderId,
    resourceHubId: overrides.folder?.resourceHubId ?? resourceHub.id,
    resourceHub,
    name: overrides.folder?.name ?? overrides.name ?? "Team Templates",
    permissions: overrides.folder?.permissions ?? createMockPermissions({ canRenameFolder: true }),
    pathToFolder: overrides.folder?.pathToFolder ?? [],
    __typename: "resource_hub_folder" as const,
  } as ResourceHubFolder;

  return {
    ...nodeOverrides,
    id: overrides.id ?? `node-${folderId}`,
    name: overrides.name ?? "Team Templates",
    type: "folder",
    folder: folderData,
    __typename: "resource_hub_node",
  };
}

export function useMockSharedListPageProps({
  parent,
  parentType,
  nodes,
  onCreateFolder,
  onCreated,
}: UseMockSharedListPagePropsArgs): SharedListPageProps {
  const folderParent = parentType === "folder" ? (parent as ResourceHubFolder) : null;
  const resourceHubParent = parentType === "resource_hub" ? (parent as ResourceHub) : null;
  const permissions = parent.permissions ?? createMockPermissions();
  const resourceHub =
    folderParent?.resourceHub ??
    (folderParent ? createMockResourceHub({ id: folderParent.resourceHubId ?? "hub-1" }) : resourceHubParent) ??
    createMockResourceHub();
  const folderId = folderParent?.id;
  const subscribers = useMockSubscribers();
  const newFileModals = useMockNewFileModals();
  const [sortBy, setSortBy] = React.useState<ResourceHubSortBy>("name");

  const sortedNodes = React.useMemo(() => {
    const order = sortBy === "name" ? "asc" : "desc";

    return sortNodesWithFoldersFirst(nodes, sortBy, order);
  }, [nodes, sortBy]);

  const getNodePath = React.useCallback((node: ResourceHubNode) => buildNodePath(node), []);

  const listContext = React.useMemo<ResourceHubNodesListContextValue>(() => {
    const parentId = parent.id ?? resourceHub.id;
    const parentName = parent.name ?? resourceHub.name ?? "Resource Hub";
    const folderNodes = nodes
      .map((node) => node.folder)
      .filter((folder): folder is ResourceHubFolder => Boolean(folder));

    return {
      parent: {
        id: parentId,
        name: parentName,
        type: parentType,
        resourceHubId: folderParent?.resourceHubId ?? resourceHub.id,
      },
      permissions,
      onRefetch: onCreated,
      paths: {
        editDocumentPath: (id) => `/resource-hub/documents/${id}/edit`,
        editFilePath: (id) => `/resource-hub/files/${id}/edit`,
        editLinkPath: (id) => `/resource-hub/links/${id}/edit`,
        documentPath: (id) => `/resource-hub/documents/${id}`,
        folderPath: (id) => `/resource-hub/folders/${id}`,
      },
      actions: {
        copyDocument: async () => undefined,
        copyFolder: async () => undefined,
        moveResource: async () => undefined,
        renameFolder: async () => undefined,
        deleteDocument: async () => undefined,
        deleteFile: async () => undefined,
        deleteFolder: async () => undefined,
        deleteLink: async () => undefined,
        downloadFile: () => undefined,
        exportDocumentMarkdown: () => undefined,
      },
      folderSelect: {
        loadFolder: async (id) => {
          const folder =
            folderNodes.find((item) => item.id === id) ??
            (folderParent?.id === id
              ? folderParent
              : createMockFolder({
                  id,
                  resourceHub,
                  resourceHubId: resourceHub.id,
                }));

          return {
            current: { type: "folder", folder },
            nodes: [],
          };
        },
        loadResourceHub: async () => ({
          current: { type: "resourceHub", resourceHub },
          nodes: folderNodes.map((folder) =>
            createMockFolderNode({
              id: `node-${folder.id}`,
              name: folder.name ?? "Folder",
              folder,
            }),
          ),
        }),
        compareIds: (left, right) => left === right,
      },
    };
  }, [folderParent, nodes, onCreated, parent, parentType, permissions, resourceHub]);

  return {
    title: parent.name ?? resourceHub.name ?? "Resource Hub",
    navigation: buildNavigation(parent, parentType, resourceHub),
    newFileModals,
    addFileWidgetProps: {
      subscriptions: subscribers,
      richTextHandlers: createMockRichEditorHandlers(),
      formatFileSize: (size) => `${size} bytes`,
      onUpload: async (_items, setProgress) => {
        setProgress(100);
      },
    },
    nodesListProps: {
      nodes: sortedNodes,
      getNodePath,
      sortBy,
      onSortChange: setSortBy,
      emptyVariant: parentType === "resource_hub" ? "hub" : "folder",
      listContext,
      getNodeTestId: (_node, index) => `node-${index}`,
    },
    addFolderModalProps: {
      resourceHubId: resourceHub.id,
      folderId,
      onCreated: onCreated ?? (() => undefined),
      onCreateFolder: onCreateFolder ?? (async () => undefined),
    },
  };
}

function buildNavigation(
  parent: ResourceHub | ResourceHubFolder,
  parentType: UseMockSharedListPagePropsArgs["parentType"],
  resourceHub: ResourceHub,
): NonNullable<Page.Props["navigation"]> {
  const paths = {
    projectOverviewPath: (id: string) => `/projects/${id}?tab=overview`,
    projectDocsAndFilesPath: (id: string) => `/projects/${id}?tab=docs-and-files`,
    goalOverviewPath: (id: string) => `/goals/${id}?tab=overview`,
    goalDocsAndFilesPath: (id: string) => `/goals/${id}?tab=docs-and-files`,
    spacePath: (id: string) => `/spaces/${id}`,
    projectWorkMapPath: (spaceId: string) => `/spaces/${spaceId}/work-map?tab=projects`,
    goalWorkMapPath: (spaceId: string) => `/spaces/${spaceId}/work-map`,
    resourceHubPath: (id: string) => `/resource-hubs/${id}`,
    resourceHubFolderPath: (id: string) => `/resource-hubs/folders/${id}`,
  };

  if (parentType === "resource_hub") {
    return resourceHubPageNavigation(resourceHub, paths);
  }

  return resourceHubFolderNavigation(parent as ResourceHubFolder, paths);
}

function buildNodePath(node: ResourceHubNode) {
  if (node.document?.id) {
    return `/resource-hub/documents/${node.document.id}`;
  }

  if (node.file?.id) {
    return `/resource-hub/files/${node.file.id}`;
  }

  if (node.folder?.id) {
    return `/resource-hub/folders/${node.folder.id}`;
  }

  if (node.link?.id) {
    return `/resource-hub/links/${node.link.id}`;
  }

  return "#";
}

function useMockNewFileModals() {
  const [showAddFolder, setShowAddFolder] = React.useState(false);
  const [files, setFiles] = React.useState<File[] | undefined>(undefined);

  return React.useMemo(
    () => ({
      showAddFolder,
      toggleShowAddFolder: () => setShowAddFolder((current) => !current),
      navigateToNewDocument: () => undefined,
      navigateToNewLink: () => undefined,
      files,
      setFiles,
      selectFiles: () => undefined,
      filesSelected: Boolean(files?.length),
    }),
    [files, showAddFolder],
  );
}

function useMockSubscribers(): SubscribersSelector.Props {
  const availableSubscribers = React.useMemo<SubscribersSelector.Subscriber[]>(
    () => [
      { person: subscriber ?? { id: "person-3", fullName: "Jordan Example", avatarUrl: null }, isSubscribed: false },
      { person: reviewer ?? { id: "person-2", fullName: "Riley Example", avatarUrl: null }, isSubscribed: false },
    ],
    [],
  );
  const [selectedSubscribers, setSelectedSubscribers] = React.useState<SubscribersSelector.Subscriber[]>([]);
  const [subscriptionType, setSubscriptionType] = React.useState<SubscribersSelector.SubscriptionOption>(
    SubscribersSelector.SubscriptionOption.ALL,
  );

  return {
    subscribers: availableSubscribers,
    selectedSubscribers,
    onSelectedSubscribersChange: setSelectedSubscribers,
    subscriptionType,
    onSubscriptionTypeChange: setSubscriptionType,
    alwaysNotify: [],
    allSubscribersLabel: "Everyone with access to this resource",
  };
}
