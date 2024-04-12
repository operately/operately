import * as React from "react";
import * as Icons from "@tabler/icons-react";

import { MenuToggleButton } from "./MenuToggleButton";

export function NumberListButton({ editor, iconSize }): JSX.Element {
  return (
    <MenuToggleButton
      onClick={() => editor.chain().focus().toggleOrderedList().run()}
      isActive={editor.isActive("orderedList")}
      title="Numbered List"
    >
      <Icons.IconListNumbers size={iconSize} />
    </MenuToggleButton>
  );
}
