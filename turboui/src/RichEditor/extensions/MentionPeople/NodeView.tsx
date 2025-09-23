import * as TipTap from "@tiptap/react";
import React from "react";

import { Avatar } from "../../../Avatar";
import { useMentionedPersonLookup } from "../../EditorContext";

//
// The node view is responsible for rendering the node as a DOM element.
// It behaves like a React component, but it needs to be wrapped in a
// TipTap.NodeViewWrapper in order to function inside the editor.
//
// The editor receives a TipTap.Node instance. The assumption is that the
// node.attrs.id is the person ID, based on which we fetch the person's avatar.
//

export const NodeView: React.FC<TipTap.NodeViewProps> = (props) => {
  const { node, updateAttributes } = props;
  const ref = React.useRef<HTMLSpanElement>(null);
  const mentionedPersonLookup = useMentionedPersonLookup();

  React.useEffect(() => {
    if (!mentionedPersonLookup) return;
    if (node.attrs.avatarUrl && node.attrs.fullName) return;

    let cancelled = false;

    mentionedPersonLookup(node.attrs.id).then((result) => {
      if (cancelled || !result) return;

      const attrs: Record<string, unknown> = {};

      if (!node.attrs.fullName && result.fullName) {
        attrs.fullName = result.fullName;
      }

      if (!node.attrs.avatarUrl && result.avatarUrl) {
        attrs.avatarUrl = result.avatarUrl;
      }

      if (Object.keys(attrs).length > 0) {
        updateAttributes(attrs);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [mentionedPersonLookup, node.attrs.avatarUrl, node.attrs.fullName, node.attrs.id, updateAttributes]);

  React.useEffect(() => {
    if (!ref.current) return;

    const size = getFontSize(ref.current);

    if (size && size !== node.attrs.avatarSize) {
      updateAttributes({ avatarSize: size });
    }
  }, [node.attrs.avatarSize, updateAttributes]);

  const displayName = node.attrs.fullName || node.attrs.label || "";
  const avatarUrl = node.attrs.avatarUrl || null;
  const avatarSize = node.attrs.avatarSize || 20;

  return (
    <TipTap.NodeViewWrapper className="inline">
      <span
        ref={ref}
        className="inline-block mr-1 align-[-4px]"
        style={{
          height: "1em",
          lineHeight: "1em",
          overflow: "visible",
        }}
      >
        <Avatar
          person={{
            id: node.attrs.id,
            fullName: displayName,
            avatarUrl,
          }}
          size={avatarSize}
        />
      </span>

      {firstName(displayName)}
    </TipTap.NodeViewWrapper>
  );
};

function firstName(name: string): string {
  if (!name) return "";

  const parts = name.split(" ");
  if (parts.length > 1) {
    return parts.slice(0, -1).join(" ");
  } else {
    return name;
  }
}

function getFontSize(element: HTMLElement): number {
  const style = window.getComputedStyle(element, null);
  const fontSize = parseFloat(style.getPropertyValue("font-size"));

  return fontSize + 3;
}
