import * as React from "react";

import type { ResourceHubNode } from "./types";
import { DocumentMenu } from "./nodeMenus/DocumentMenu";
import { FileMenu } from "./nodeMenus/FileMenu";
import { FolderMenu } from "./nodeMenus/FolderMenu";
import { LinkMenu } from "./nodeMenus/LinkMenu";

interface NodeMenuProps {
  node: ResourceHubNode;
}

export function NodeMenu({ node }: NodeMenuProps) {
  if (!node.menuData) return null;

  switch (node.menuData.type) {
    case "folder":
      return (
        <div className="flex items-center">
          <FolderMenu folder={node.menuData} />
        </div>
      );
    case "document":
      return (
        <div className="flex items-center">
          <DocumentMenu document={node.menuData} />
        </div>
      );
    case "file":
      return (
        <div className="flex items-center">
          <FileMenu file={node.menuData} />
        </div>
      );
    case "link":
      return (
        <div className="flex items-center">
          <LinkMenu link={node.menuData} />
        </div>
      );
    default:
      return null;
  }
}
