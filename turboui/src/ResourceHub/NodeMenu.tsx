import * as React from "react";

import { getNodeDocument, getNodeFile, getNodeFolder, getNodeLink } from "./selectors";
import type { ResourceHubNode } from "./types";
import { DocumentMenu } from "./nodeMenus/DocumentMenu";
import { FileMenu } from "./nodeMenus/FileMenu";
import { FolderMenu } from "./nodeMenus/FolderMenu";
import { LinkMenu } from "./nodeMenus/LinkMenu";

interface NodeMenuProps {
  node: ResourceHubNode;
}

export function NodeMenu({ node }: NodeMenuProps) {
  const folder = getNodeFolder(node);
  const document = getNodeDocument(node);
  const file = getNodeFile(node);
  const link = getNodeLink(node);

  if (folder) {
    return (
      <div className="flex items-center">
        <FolderMenu folder={folder} />
      </div>
    );
  }

  if (document) {
    return (
      <div className="flex items-center">
        <DocumentMenu document={document} />
      </div>
    );
  }

  if (file) {
    return (
      <div className="flex items-center">
        <FileMenu file={file} />
      </div>
    );
  }

  if (link) {
    return (
      <div className="flex items-center">
        <LinkMenu link={link} />
      </div>
    );
  }

  return null;
}
