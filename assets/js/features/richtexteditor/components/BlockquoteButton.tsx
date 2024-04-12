import * as React from "react";
import * as Icons from "@tabler/icons-react";

import { MenuToggleButton } from "./MenuToggleButton";

export function BlockquoteButton({ editor, iconSize }): JSX.Element {
  return (
    <MenuToggleButton
      onClick={() => editor.chain().focus().toggleBlockquote().run()}
      isActive={editor.isActive("blockquote")}
      title="Quote"
    >
      <Icons.IconBlockquote size={iconSize} />
    </MenuToggleButton>
  );
}
