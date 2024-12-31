import {
  ResourceHub,
  ResourceHubDocument,
  ResourceHubFile,
  ResourceHubFolder,
  ResourceHubLink,
} from "@/models/resourceHubs";

export { MoveResourceModal, MoveResourceMenuItem } from "./MoveResource";

export type Location = ResourceHub | ResourceHubFolder;
export type MovableResource = ResourceHubFile | ResourceHubFolder | ResourceHubDocument | ResourceHubLink;
export type MovableType = "file" | "folder" | "document" | "link";
