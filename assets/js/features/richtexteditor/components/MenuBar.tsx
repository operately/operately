import React from "react";

import { BlockquoteButton } from "./BlockquoteButton";
import { BoldButton } from "./BoldButton";
import { BulletListButton } from "./BulletListButton";
import { H1Button } from "./H1Button";
import { H2Button } from "./H2Button";
import { ItalicButton } from "./ItalicButton";
import { LinkButton } from "./LinkButton";
import { NumberListButton } from "./NumberListButton";
import { RedoButton } from "./RedoButton";
import { StrikeButton } from "./StrikeButton";
import { UndoButton } from "./UndoButton";
import { AttachmentButton } from "./AttachmentButton";

import { LinkEditForm } from "@/components/Editor";

interface Props {
  editor: any;
  noTopBorder?: boolean;
}

export function MenuBar({ editor, noTopBorder }: Props): JSX.Element {
  if (!editor) return <></>;

  const border = noTopBorder ? "border-b" : "border-y";

  return (
    <div className="sticky bg-surface z-10 rounded-t top-0">
      <div className={"flex items-center gap-3 border-stroke-base" + " " + border}>
        <div className="flex justify-between items-center w-full">
          <div className="flex items-center">
            <BoldButton editor={editor} iconSize={20} />
            <ItalicButton editor={editor} iconSize={20} />
            <StrikeButton editor={editor} iconSize={20} />
            <LinkButton editor={editor} iconSize={20} />

            <BulletListButton editor={editor} iconSize={20} />
            <NumberListButton editor={editor} iconSize={20} />

            <H1Button editor={editor} iconSize={20} />
            <H2Button editor={editor} iconSize={20} />

            <BlockquoteButton editor={editor} iconSize={20} />
            <AttachmentButton editor={editor} iconSize={20} />
          </div>

          <div className="flex items-center gap-1">
            <UndoButton editor={editor} iconSize={20} />
            <RedoButton editor={editor} iconSize={20} />
          </div>
        </div>
      </div>

      <LinkEditForm editor={editor} />
    </div>
  );
}
