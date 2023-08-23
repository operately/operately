import React from "react";

import classnames from "classnames";
import * as Icons from "@tabler/icons-react";

function MenuBarToggle({ children, isActive, onClick }): JSX.Element {
  let className = classnames("p-1 text-white-1 rounded", {
    "bg-shade-1": isActive,
    "hover:bg-shade-1": !isActive,
  });

  return (
    <button onClick={onClick} className={className}>
      {children}
    </button>
  );
}

function MenuBarButton({ children, onClick, disabled = false }): JSX.Element {
  let className = classnames("p-1 text-white-1 rounded", {
    "hover:bg-shade-1 cursor-pointer": !disabled,
    "text-dark-8": disabled,
  });

  return (
    <button onClick={onClick} className={className} disabled={disabled}>
      {children}
    </button>
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
      <Icons.IconArrowForward size={iconSize} />
    </MenuBarButton>
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
        <div className="flex items-center border border-shade-2 rounded-lg">
          <BoldButton editor={editor} iconSize={16} />
          <ItalicButton editor={editor} iconSize={16} />
          <BulletListButton editor={editor} iconSize={16} />
        </div>

        <div className="flex items-center border border-shade-2 rounded-lg">
          <UndoButton editor={editor} iconSize={16} />
          <RedoButton editor={editor} iconSize={16} />
        </div>
      </div>
    );
  }

  if (variant === "large") {
    return (
      <div className="flex items-center gap-3 border-y border-shade-2 py-1 mt-4 -mx-2">
        <div className="flex items-center gap-1">
          <BoldButton editor={editor} iconSize={20} />
          <ItalicButton editor={editor} iconSize={20} />
          <BulletListButton editor={editor} iconSize={20} />
        </div>

        <div className="flex items-center gap-1">
          <UndoButton editor={editor} iconSize={20} />
          <RedoButton editor={editor} iconSize={20} />
        </div>
      </div>
    );
  }

  throw new Error("Invalid toolbar variant");
}
