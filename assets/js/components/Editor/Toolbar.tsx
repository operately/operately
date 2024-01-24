import React from "react";

import classnames from "classnames";
import * as Icons from "@tabler/icons-react";
import Button from "@/components/Button";

import { EditorContext, Context } from "./index";
import { AddBlobsEditorCommand } from "./Blob/AddBlobsEditorCommand";

function MenuBarToggle({ children, isActive, onClick }): JSX.Element {
  let className = classnames("p-1 text-content-accent rounded", {
    "bg-surface-highlight": isActive,
    "hover:bg-surface-highlight": !isActive,
  });

  return (
    <button onClick={onClick} className={className}>
      {children}
    </button>
  );
}

function MenuBarButton({ children, onClick, disabled = false }): JSX.Element {
  let className = classnames("p-1 text-content-accent rounded text-xs", {
    "hover:bg-surface-accent cursor-pointer": !disabled,
    "text-content-subtle": disabled,
  });

  return (
    <button onClick={onClick} className={className} disabled={disabled}>
      {children}
    </button>
  );
}

function H1Button({ editor, iconSize }): JSX.Element {
  return (
    <MenuBarToggle
      onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
      isActive={editor.isActive("heading", { level: 1 })}
    >
      <Icons.IconH1 size={iconSize} />
    </MenuBarToggle>
  );
}

function H2Button({ editor, iconSize }): JSX.Element {
  return (
    <MenuBarToggle
      onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      isActive={editor.isActive("heading", { level: 2 })}
    >
      <Icons.IconH2 size={iconSize} />
    </MenuBarToggle>
  );
}

function BoldButton({ editor, iconSize }): JSX.Element {
  return (
    <MenuBarToggle onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive("bold")}>
      <Icons.IconBold size={iconSize} />
    </MenuBarToggle>
  );
}

function ItalicButton({ editor, iconSize }): JSX.Element {
  return (
    <MenuBarToggle onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive("italic")}>
      <Icons.IconItalic size={iconSize} />
    </MenuBarToggle>
  );
}

function StrikeButton({ editor, iconSize }): JSX.Element {
  return (
    <MenuBarToggle onClick={() => editor.chain().focus().toggleStrike().run()} isActive={editor.isActive("strike")}>
      <Icons.IconStrikethrough size={iconSize} />
    </MenuBarToggle>
  );
}

function BulletListButton({ editor, iconSize }): JSX.Element {
  return (
    <MenuBarToggle
      onClick={() => editor.chain().focus().toggleBulletList().run()}
      isActive={editor.isActive("bulletList")}
    >
      <Icons.IconList size={iconSize} />
    </MenuBarToggle>
  );
}

function BlockquoteButton({ editor, iconSize }): JSX.Element {
  return (
    <MenuBarToggle
      onClick={() => editor.chain().focus().toggleBlockquote().run()}
      isActive={editor.isActive("blockquote")}
    >
      <Icons.IconBlockquote size={iconSize} />
    </MenuBarToggle>
  );
}

function NumberListButton({ editor, iconSize }): JSX.Element {
  return (
    <MenuBarToggle
      onClick={() => editor.chain().focus().toggleOrderedList().run()}
      isActive={editor.isActive("orderedList")}
    >
      <Icons.IconListNumbers size={iconSize} />
    </MenuBarToggle>
  );
}

function UndoButton({ editor, iconSize }): JSX.Element {
  return (
    <MenuBarButton onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()}>
      <Icons.IconArrowBackUp size={iconSize} />
    </MenuBarButton>
  );
}

function RedoButton({ editor, iconSize }): JSX.Element {
  return (
    <MenuBarButton onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()}>
      <Icons.IconArrowForwardUp size={iconSize} />
    </MenuBarButton>
  );
}

function LinkButton({ editor, iconSize }): JSX.Element {
  const { setLinkEditActive } = React.useContext(EditorContext) as Context;

  const setLink = React.useCallback(() => {
    if (editor.isActive("link")) {
      editor.chain().focus().unsetLink().run();
    } else {
      editor.chain().focus().extendMarkRange("link").setLink({ href: "https://" }).run();
      setLinkEditActive(true);
    }
  }, [editor]);

  return (
    <MenuBarToggle onClick={setLink} isActive={editor.isActive("link")}>
      <Icons.IconLink size={iconSize} />
    </MenuBarToggle>
  );
}

function AttachmentButton({ editor, iconSize }): JSX.Element {
  let ref = React.useRef<HTMLInputElement | null>(null);

  const handleClick = React.useCallback(() => {
    if (ref.current) ref.current.click();
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
    <MenuBarButton onClick={handleClick}>
      <input
        multiple
        type="file"
        id="file"
        style={{ display: "none" }}
        onChange={addBlob}
        ref={(r: any) => (ref.current = r)}
      />
      <Icons.IconPaperclip size={iconSize} />
    </MenuBarButton>
  );
}

function EditLinkButton({ editor }): JSX.Element {
  const { setLinkEditActive } = React.useContext(EditorContext) as Context;
  if (!editor.isActive("link")) return <></>;

  return (
    <Button onClick={() => setLinkEditActive(true)} size="tiny">
      Edit Link
    </Button>
  );
}

interface MenuBarProps {
  editor: any;
  variant: "small" | "large";
}

export default function MenuBar({ editor, variant }: MenuBarProps): JSX.Element {
  if (!editor) return <></>;

  if (variant === "small") {
    return (
      <div className="flex items-center gap-2 rounded-lg">
        <div className="flex items-center border border-stroke-base rounded-lg">
          <EditLinkButton editor={editor} iconSize={20} />
        </div>

        <div className="flex items-center border border-shade-2 rounded-lg">
          <BoldButton editor={editor} iconSize={20} />
          <ItalicButton editor={editor} iconSize={20} />
          <StrikeButton editor={editor} iconSize={20} />
        </div>

        <div className="flex items-center border border-shade-2 rounded-lg">
          <BulletListButton editor={editor} iconSize={20} />
          <NumberListButton editor={editor} iconSize={20} />
        </div>

        <div className="flex items-center border border-shade-2 rounded-lg">
          <H1Button editor={editor} iconSize={20} />
          <H2Button editor={editor} iconSize={20} />

          <BlockquoteButton editor={editor} iconSize={20} />
          <LinkButton editor={editor} iconSize={20} />
          <AttachmentButton editor={editor} iconSize={20} />
        </div>

        <div className="flex items-center border border-shade-2 rounded-lg">
          <UndoButton editor={editor} iconSize={20} />
          <RedoButton editor={editor} iconSize={20} />
        </div>
      </div>
    );
  }

  if (variant === "large") {
    return (
      <div className="flex items-center gap-3 border-y border-stroke-base py-1">
        <div className="flex justify-between items-center w-full">
          <div className="flex items-center gap-1">
            <BoldButton editor={editor} iconSize={20} />
            <ItalicButton editor={editor} iconSize={20} />
            <StrikeButton editor={editor} iconSize={20} />

            <BulletListButton editor={editor} iconSize={20} />
            <NumberListButton editor={editor} iconSize={20} />

            <H1Button editor={editor} iconSize={20} />
            <H2Button editor={editor} iconSize={20} />

            <BlockquoteButton editor={editor} iconSize={20} />
            <LinkButton editor={editor} iconSize={20} />
            <AttachmentButton editor={editor} iconSize={20} />
          </div>

          <div className="flex items-center gap-1">
            <UndoButton editor={editor} iconSize={20} />
            <RedoButton editor={editor} iconSize={20} />
          </div>
        </div>
      </div>
    );
  }

  throw new Error("Invalid toolbar variant");
}
