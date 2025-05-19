import * as Icons from "lucide-react";
import * as React from "react";

import { ToolbarToggleButton } from "./ToolbarToggleButton";

import { EditorContext } from "../EditorContext";

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
      <Icons.Link size={iconSize - 2} />
    </ToolbarToggleButton>
  );
}
