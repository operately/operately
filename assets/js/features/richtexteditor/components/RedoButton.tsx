import * as React from "react";
import * as Icons from "@tabler/icons-react";

import { MenuButton } from "./MenuButton";

export function RedoButton({ editor, iconSize }): JSX.Element {
  return (
    <MenuButton onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Redo">
      <Icons.IconArrowForwardUp size={iconSize} />
    </MenuButton>
  );
}
