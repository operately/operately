import type * as React from "react";

export type ResourceHubNodeType = "document" | "folder" | "file" | "link";
export type ResourceHubSortBy = "name" | "insertedAt" | "updatedAt";
export type ResourceHubLinkType =
  | "airtable"
  | "dropbox"
  | "figma"
  | "google"
  | "google_doc"
  | "google_sheet"
  | "google_slides"
  | "notion"
  | "other";

export interface ResourceHubPermissions {
  canCreateDocument: boolean;
  canCreateFile: boolean;
  canCreateFolder: boolean;
  canCreateLink: boolean;
}

export interface ResourceHubListPermissions extends ResourceHubPermissions {
  canView: boolean;
  canEditDocument: boolean;
  canEditFile: boolean;
  canEditLink: boolean;
  canEditParentFolder: boolean;
  canDeleteDocument: boolean;
  canDeleteFile: boolean;
  canDeleteFolder: boolean;
  canDeleteLink: boolean;
  canRenameFolder: boolean;
  canCopyFolder: boolean;
}

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

export interface ResourceHubNodeMenuDataBase {
  id: string;
  name: string;
  parentFolderId?: string | null;
  resourceHubId?: string | null;
}

export interface ResourceHubDocumentMenuData extends ResourceHubNodeMenuDataBase {
  type: "document";
  content?: string | null;
}

export interface ResourceHubFolderMenuData extends ResourceHubNodeMenuDataBase {
  type: "folder";
}

export interface ResourceHubFileMenuData extends ResourceHubNodeMenuDataBase {
  type: "file";
  downloadUrl?: string | null;
}

export interface ResourceHubLinkMenuData extends ResourceHubNodeMenuDataBase {
  type: "link";
}

export type ResourceHubNodeMenuData =
  | ResourceHubDocumentMenuData
  | ResourceHubFolderMenuData
  | ResourceHubFileMenuData
  | ResourceHubLinkMenuData;

export type ResourceHubResourceTypeName = "document" | "folder" | "file" | "link";

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

export interface ResourceHubNotAllowedSelection {
  id: string;
  type: ResourceHubResourceTypeName;
}

export interface ResourceHubFolderSelectFieldProps {
  label: string;
  field: string;
  notAllowedSelections?: ResourceHubNotAllowedSelection[];
}

export interface ResourceHubFormsApi {
  useForm: (options: Record<string, unknown>) => ResourceHubFormState;
  Form: React.ComponentType<{ form: ResourceHubFormState; testId?: string; children: React.ReactNode }>;
  FieldGroup: React.ComponentType<{ children: React.ReactNode }>;
  TextInput: React.ComponentType<{
    label: string;
    field: string;
    testId?: string;
    autoFocus?: boolean;
    required?: boolean;
  }>;
  Submit: React.ComponentType<{ saveText?: string; cancelText?: string }>;
  InputField: React.ComponentType<{ label: string; field: string; error?: string; children: React.ReactNode }>;
}

export interface ResourceHubFormState {
  values: Record<string, unknown>;
  actions: {
    reset: () => void;
  };
}

export interface ResourceHubModalApi {
  Modal: React.ComponentType<{
    isOpen: boolean;
    hideModal?: () => void;
    title?: string;
    children: React.ReactNode;
  }>;
}

export interface ResourceHubResourceHeader {
  name: string;
  permissions?: ResourceHubPermissions;
}

export interface ResourceHubNode {
  id: string;
  name: string;
  type: ResourceHubNodeType;
  path: string;
  insertedAt?: string | null;
  updatedAt?: string | null;
  commentsCount: number;
  authorName?: string | null;
  childrenCount?: number | null;
  size?: number | null;
  description?: string | null;
  linkType?: ResourceHubLinkType | null;
  contentType?: string | null;
  thumbnail?: ResourceHubThumbnail | null;
  menuData?: ResourceHubNodeMenuData;
}

export interface ResourceHubThumbnail {
  url: string;
  width: number;
  height: number;
  alt: string;
}

export interface ResourceHubDraftNode extends ResourceHubNode {
  editPath?: string;
}
