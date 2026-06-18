import type {
  ResourceHub as ApiResourceHub,
  ResourceHubDocument as ApiResourceHubDocument,
  ResourceHubFile as ApiResourceHubFile,
  ResourceHubFolder as ApiResourceHubFolder,
  ResourceHubLink as ApiResourceHubLink,
  ResourceHubLinkType as ApiResourceHubLinkType,
  ResourceHubNode as ApiResourceHubNode,
  ResourceHubPermissions as ApiResourceHubPermissions,
} from "../ApiTypes";

export type ResourceHub = ApiResourceHub;
export type ResourceHubDocument = ApiResourceHubDocument;
export type ResourceHubFile = ApiResourceHubFile;
export type ResourceHubFolder = ApiResourceHubFolder;
export type ResourceHubLink = ApiResourceHubLink;
export type ResourceHubLinkType = ApiResourceHubLinkType;
export type ResourceHubNode = ApiResourceHubNode;
export type ResourceHubPermissions = ApiResourceHubPermissions;

export type ResourceHubNodeType = "document" | "folder" | "file" | "link";
export type ResourceHubSortBy = "name" | "insertedAt" | "updatedAt";
export type ResourceHubResourceTypeName = ResourceHubNodeType;

export type ResourceHubResource = ResourceHubDocument | ResourceHubFolder | ResourceHubFile | ResourceHubLink;

export interface ResourceHubListParent {
  id: string;
  name: string;
  type: "resource_hub" | "folder";
  resourceHubId?: string | null;
}

export interface ResourceHubLocationSelection {
  id?: string | null;
  type: "folder" | "resourceHub";
}

export interface CopyDocumentArgs {
  documentId: string;
  name: string;
  content?: string | null;
  resourceHubId?: string | null;
  location: ResourceHubLocationSelection;
}

export interface CopyFolderArgs {
  folderId: string;
  name: string;
  resourceHubId?: string | null;
  location: ResourceHubLocationSelection;
}

export interface MoveResourceArgs {
  resourceId: string;
  resourceType: ResourceHubResourceTypeName;
  newFolderId: string | null;
}

export interface ResourceHubNodesListPaths {
  editDocumentPath: (id: string) => string;
  editFilePath: (id: string) => string;
  editLinkPath: (id: string) => string;
  documentPath: (id: string) => string;
  folderPath: (id: string) => string;
}

export interface ResourceHubNodesListActions {
  deleteDocument: (id: string) => Promise<void>;
  deleteFile: (id: string) => Promise<void>;
  deleteFolder: (id: string) => Promise<void>;
  deleteLink: (id: string) => Promise<void>;
  renameFolder: (id: string, name: string) => Promise<void>;
  moveResource: (args: MoveResourceArgs) => Promise<void>;
  copyDocument: (args: CopyDocumentArgs) => Promise<void>;
  copyFolder: (args: CopyFolderArgs) => Promise<void>;
  downloadFile: (url: string, name: string) => void;
  exportDocumentMarkdown: (content: string, name: string) => void;
}

export interface ResourceHubNotAllowedSelection {
  id: string;
  type: ResourceHubResourceTypeName;
}

export interface ResourceHubNavigationPaths {
  projectPath: (id: string) => string;
  goalPath: (id: string) => string;
  spacePath: (id: string) => string;
  resourceHubPath: (id: string) => string;
  resourceHubFolderPath: (id: string) => string;
}

export type FolderSelectCurrentLocation =
  | { type: "folder"; folder: ResourceHubFolder }
  | { type: "resourceHub"; resourceHub: ResourceHub };

export interface FolderSelectLoadResult {
  current: FolderSelectCurrentLocation;
  nodes: ResourceHubNode[];
}

export interface ResourceHubFolderSelectApi {
  loadFolder: (id: string) => Promise<FolderSelectLoadResult>;
  loadResourceHub: (id: string) => Promise<FolderSelectLoadResult>;
  compareIds: (a: string, b: string) => boolean;
}

export interface ResourceHubFolderSelectFieldProps {
  label: string;
  field: string;
  notAllowedSelections?: ResourceHubNotAllowedSelection[];
}

export interface ResourceHubResourceHeader {
  name: string;
  permissions?: ResourceHubPermissions | null;
}
