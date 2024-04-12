import * as React from "react";
import * as Icons from "@tabler/icons-react";

import { AddBlobsEditorCommand } from "@/components/Editor/Blob/AddBlobsEditorCommand";
import { MenuButton } from "./MenuButton";

//
// To activate the file chooser, we need to add a hiden input element to the DOM, with the type=file.
// Then, when the user clicks the button, we trigger a click event on that input element, which will open the file chooser.
//
export function AttachmentButton({ editor, iconSize }): JSX.Element {
  let ref = React.useRef<HTMLInputElement | null>(null);

  const handleClick = React.useCallback(() => {
    console.log("click");
    // if (ref.current) ref.current.click();
  }, [ref]);

  const addBlob = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!e.target.files) return;
      if (e.target.files.length === 0) return;

      AddBlobsEditorCommand({
        files: e.target.files,
        pos: editor.state.selection.from,
        view: editor.view,
      });
    },
    [editor],
  );

  return (
    <>
      <MenuButton onClick={handleClick} title="Add an Image or File">
        <Icons.IconPaperclip size={iconSize} />
      </MenuButton>

      <input
        multiple
        type="file"
        id="file"
        style={{ display: "block" }}
        onChange={addBlob}
        ref={(r: any) => (ref.current = r)}
      />
    </>
  );
}
