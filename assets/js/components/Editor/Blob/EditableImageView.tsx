import React from "react";

import { NodeViewWrapper, NodeViewContent } from "@tiptap/react";
import * as Icons from "@tabler/icons-react";

//
// This is view component for the image node for the TipTap editor.
//
// It has editable and non-editable parts:
// - The image itself is not editable.
// - The title is editable.
// - The delete button is not editable.
//
// The delete button is only visible when the user hovers over the image.
//

export function EditableImageView({ node, deleteNode, updateAttributes }) {
  const disableEnter = (e: React.KeyboardEvent<HTMLSpanElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      return;
    }
  };

  const updateTitle = (e: React.FocusEvent<HTMLSpanElement>) => {
    updateAttributes({
      alt: e.target.innerText,
      title: e.target.innerText,
    });
  };

  return (
    <NodeViewWrapper className="blob-container relative group">
      <img
        src={node.attrs.src}
        alt={node.attrs.alt}
        title={node.attrs.title}
        className="group-hover:border-white-3 transition-colors"
        data-drag-handle
      />

      <div className="footer flex items-center justify-center">
        <NodeViewContent
          className="title outline-none"
          contentEditable={true}
          suppressContentEditableWarning={true}
          onKeyDown={disableEnter}
          onBlur={updateTitle}
        >
          {node.attrs.alt}
        </NodeViewContent>
      </div>

      {node.attrs.status === "uploading" && (
        <div className="top-1/2 left-1/2 absolute transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
          <div className="bg-dark-1 rounded-xl text-white-1 font-medium w-32 h-5 overflow-hidden">
            <div className="bg-green-400 h-full" style={{ width: `${node.attrs.progress}%` }}></div>
          </div>
        </div>
      )}

      <div className="absolute top-2 right-2 p-2 hover:scale-105 bg-red-400 rounded-full group-hover:opacity-100 opacity-0 cursor-pointer transition-opacity">
        <Icons.IconTrash onClick={deleteNode} size={16} className="text-white-1" />
      </div>
    </NodeViewWrapper>
  );
}
