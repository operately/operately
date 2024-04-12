import * as React from "react";
import * as Icons from "@tabler/icons-react";

import { MenuButton } from "./MenuButton";

export function UndoButton({ editor, iconSize }): JSX.Element {
  return (
    <MenuButton onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Undo">
      <Icons.IconArrowBackUp size={iconSize} />
    </MenuButton>
  );
}
