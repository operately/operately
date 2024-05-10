import * as React from "react";
import * as Icons from "@tabler/icons-react";

import { ToolbarToggleButton } from "./ToolbarToggleButton";

import { EditorContext } from "@/components/Editor";

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
      <Icons.IconLink size={iconSize} />
    </ToolbarToggleButton>
  );
}
