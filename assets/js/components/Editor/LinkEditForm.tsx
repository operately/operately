import React from "react";

import Button from "@/components/Button";

import { EditorContext, Context } from "./EditorContext";

export function LinkEditForm({ editor }): JSX.Element {
  const { linkEditActive, setLinkEditActive } = React.useContext(EditorContext) as Context;
  const [link, setLink] = React.useState(editor?.getAttributes("link")?.href || "");

  const unlink = React.useCallback(() => {
    editor.chain().focus().unsetLink().run();
    setLinkEditActive(false);
  }, [editor]);

  const save = React.useCallback(() => {
    editor.chain().focus().setLink({ href: link }).run();
    setLinkEditActive(false);
  }, [editor, link]);

  if (!editor) return <></>;
  if (!editor.isActive("link")) return <></>;
  if (!linkEditActive) return <></>;

  return (
    <div className="bg-surface border-b border-stroke-base">
      <div className="p-1 flex flex-col gap-1 w-full">
        <div className="flex items-center gap-4">
          <input
            autoFocus
            type="text"
            className="flex-1 px-2 py-1 border border-surface-outline rounded-lg text-sm bg-transparent focus:outline-none focus:ring-2 focus:ring-surface-outline text-content-accent"
            value={link}
            placeholder="ex. https://example.com"
            onChange={(e) => setLink(e.target.value)}
          />

          <Button onClick={save} variant="success" size="small">
            Save
          </Button>

          <Button onClick={unlink} variant="secondary" size="small">
            Unlink
          </Button>
        </div>
      </div>
    </div>
  );
}
