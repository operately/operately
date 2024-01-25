import React from "react";

import { EditorContext, Context } from "./EditorContext";
import { FilledButton } from "@/components/Button";
import classNames from "classnames";

export function useLinkEditFormClose() {
  const { editor, linkEditActive, setLinkEditActive } = React.useContext(EditorContext) as Context;

  return React.useCallback(
    (e: any) => {
      if (!editor) return;

      // close link edit form if clicked outside the link edit form
      if (linkEditActive && !e.target.matches("[data-link-edit-form]  *")) {
        e.preventDefault();
        e.stopPropagation();

        editor.chain().toggleHighlight({ color: "#74c0fc" }).run();

        setLinkEditActive(false);
      }
    },
    [linkEditActive, editor],
  );
}

export function LinkEditForm({ editor }): JSX.Element {
  const { linkEditActive, setLinkEditActive } = React.useContext(EditorContext) as Context;
  const [link, setLink] = React.useState(editor?.getAttributes("link")?.href || "");

  const isSelectionLink = React.useMemo(() => {
    if (!editor) return false;
    return editor.isActive("link");
  }, [editor]);

  const unlink = React.useCallback(() => {
    editor.chain().focus().unsetLink().run();
    setLinkEditActive(false);
  }, [editor]);

  const save = React.useCallback(() => {
    editor.chain().focus().setLink({ href: link }).run();
    setLinkEditActive(false);
  }, [editor, link]);

  React.useEffect(() => {
    if (!editor) return;

    if (linkEditActive) {
      editor.chain().toggleHighlight({ color: "#74c0fc" }).run();
    } else {
      editor.chain().unsetHighlight().run();
    }
  }, [editor, linkEditActive]);

  if (!editor) return <></>;
  if (!linkEditActive) return <></>;

  return (
    <div className="border-b border-stroke-base" data-link-edit-form>
      <div className="p-1.5 flex flex-col gap-1 w-full">
        <div className="flex items-center gap-1">
          <input
            autoFocus
            type="text"
            className={classNames(
              "flex-1 px-2 py-1 border border-surface-outline",
              "rounded-lg text-sm focus:outline-none focus:ring-0",
              "text-content-accent bg-surface",
            )}
            value={link}
            placeholder="ex. https://example.com"
            onChange={(e) => setLink(e.target.value)}
          />

          {isSelectionLink ? (
            <>
              <FilledButton onClick={save} size="xxs" type="primary">
                Save
              </FilledButton>

              <FilledButton onClick={unlink} size="xxs" type="secondary">
                Unlink
              </FilledButton>
            </>
          ) : (
            <>
              <FilledButton onClick={save} size="xxs" type="primary">
                Add
              </FilledButton>

              <FilledButton onClick={unlink} size="xxs" type="secondary">
                Cancel
              </FilledButton>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
