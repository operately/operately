import { ResourceHub, ResourceHubDocument, ResourceHubFile, ResourceHubFolder } from "@/models/resourceHubs";

export { MoveResourceModal, MoveResourceMenuItem } from "./MoveResource";

export type Location = ResourceHub | ResourceHubFolder;
export type MovableResource = ResourceHubFile | ResourceHubFolder | ResourceHubDocument;
export type MovableType = "file" | "folder" | "document";
