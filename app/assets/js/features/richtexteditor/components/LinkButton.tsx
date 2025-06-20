import * as React from "react";

import { ToolbarToggleButton } from "./ToolbarToggleButton";

import { EditorContext } from "@/components/Editor";
import { LucideLink } from "turboui";

export function LinkButton({ editor, iconSize }): JSX.Element {
  const { linkEditActive, setLinkEditActive } = React.useContext(EditorContext);

  const toggleLink = React.useCallback(() => {
    if (linkEditActive) {
      setLinkEditActive(false);
    } else {
      setLinkEditActive(true);
    }
  }, [editor]);

  return (
    <ToolbarToggleButton
      onClick={toggleLink}
      isActive={editor?.isActive("link") || linkEditActive}
      title="Add/Edit Links"
    >
      <LucideLink size={iconSize - 2} />
    </ToolbarToggleButton>
  );
}
