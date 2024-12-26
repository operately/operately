import React from "react";

import * as Hub from "@/models/resourceHubs";
import * as Icons from "@tabler/icons-react";

import { assertPresent } from "@/utils/assertions";
import { ImageWithPlaceholder } from "@/components/Image";

export function NodeIcon({ node, size }: { node: Hub.ResourceHubNode; size: number }) {
  if (Hub.isFolder(node)) {
    return <FolderIcon size={size} />;
  }

  if (Hub.isDocument(node)) {
    return <Icons.IconFile size={size} />;
  }

  if (Hub.isImage(node)) {
    return <Thumbnail file={node.file!} size={size} />;
  }

  if (Hub.hasContentType(node, "pdf")) {
    return <Icons.IconFileTypePdf size={size} />;
  }

  if (Hub.hasContentType(node, "video")) {
    return <Icons.IconMovie size={size} />;
  }

  if (Hub.hasContentType(node, "audio")) {
    return <Icons.IconMusic size={size} />;
  }

  return <Icons.IconFile size={size} />;
}

export function FolderIcon({ size }: { size: number }) {
  return <Icons.IconFolderFilled size={size} className="text-sky-500" />;
}

function Thumbnail({ file, size }: { file: Hub.ResourceHubFile; size: number }) {
  assertPresent(file.blob, "blob must be present in file");

  const imgRatio = file.blob.height! / file.blob.width!;

  return (
    <div style={{ width: size, height: size * imgRatio }}>
      <ImageWithPlaceholder src={file.blob.url!} alt={file.name!} ratio={imgRatio} />
    </div>
  );
}
