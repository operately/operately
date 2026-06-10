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
