import * as React from "react";
import * as Icons from "@tabler/icons-react";

import { MenuToggleButton } from "./MenuToggleButton";

export function BoldButton({ editor, iconSize }): JSX.Element {
  return (
    <MenuToggleButton
      onClick={() => editor.chain().focus().toggleBold().run()}
      isActive={editor.isActive("bold")}
      title="Bold"
    >
      <Icons.IconBold size={iconSize} />
    </MenuToggleButton>
  );
}
