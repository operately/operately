import * as React from "react";
import * as Icons from "@tabler/icons-react";

import { MenuToggleButton } from "./MenuToggleButton";

export function StrikeButton({ editor, iconSize }): JSX.Element {
  return (
    <MenuToggleButton
      onClick={() => editor.chain().focus().toggleStrike().run()}
      isActive={editor.isActive("strike")}
      title="Strikethrough"
    >
      <Icons.IconStrikethrough size={iconSize} />
    </MenuToggleButton>
  );
}
