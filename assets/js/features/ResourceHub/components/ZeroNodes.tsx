import React from "react";
import { IconFile } from "@tabler/icons-react";

export function HubZeroNodes() {
  return (
    <div className="border border-dashed border-stroke-base p-4 w-[500px] mx-auto mt-12 flex gap-4">
      <IconFile size={48} className="text-gray-600" />
      <div>
        <div className="font-bold">Ready for your first document</div>
        <br />
        <div>Your team's central hub for sharing documents, images, videos, and files. Click 'Add' to get started.</div>
      </div>
    </div>
  );
}

export function FolderZeroNodes() {
  return (
    <div className="border border-dashed border-stroke-base p-4 w-[500px] mx-auto mt-12 flex gap-4">
      <IconFile size={48} className="text-gray-600" />
      <div>
        <div className="font-bold">Nothing here just yet.</div>
        <br />
        <div>A place to share rich text documents, images, videos, and other files.</div>
      </div>
    </div>
  );
}
