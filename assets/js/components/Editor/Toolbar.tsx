import React from "react";

import * as Icons from "tabler-icons-react";

const baseClass = "p-1";
const activeClass = ["bg-blue-400", "text-dark-1"].join(" ");
const inactiveClass = ["hover:bg-shade-1", "transition"].join(" ");

function MenuBarToggle({ children, isActive, onClick }): JSX.Element {
  let className = baseClass + " " + (isActive ? activeClass : inactiveClass);

  return (
    <button onClick={onClick} className={className}>
      {children}
    </button>
  );
}

function BoldButton({ editor }): JSX.Element {
  return (
    <MenuBarToggle
      onClick={() => editor.chain().focus().toggleBold().run()}
      isActive={editor.isActive("bold")}
    >
      <Icons.Bold size={20} />
    </MenuBarToggle>
  );
}

function ItalicButton({ editor }): JSX.Element {
  return (
    <MenuBarToggle
      onClick={() => editor.chain().focus().toggleItalic().run()}
      isActive={editor.isActive("italic")}
    >
      <Icons.Italic size={20} />
    </MenuBarToggle>
  );
}

function BulletListButton({ editor }): JSX.Element {
  return (
    <MenuBarToggle
      onClick={() => editor.chain().focus().toggleBulletList().run()}
      isActive={editor.isActive("bulletList")}
    >
      <Icons.List size={20} />
    </MenuBarToggle>
  );
}

export default function MenuBar({ editor }): JSX.Element | null {
  if (!editor) {
    return null;
  }

  return (
    <>
      <BoldButton editor={editor} />
      <ItalicButton editor={editor} />
      <BulletListButton editor={editor} />
    </>
  );
}
