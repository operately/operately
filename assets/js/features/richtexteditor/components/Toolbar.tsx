import React from "react";

import { AttachmentButton } from "./AttachmentButton";
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

import { LinkEditForm } from "@/components/Editor";
import { CodeBlockButton } from "./CodeBlockButton";
import { Brush } from "./Brush";
import { DividerButton } from "./DividerButton";

interface Props {
  editor: any;
  noTopBorder?: boolean;
}

export function Toolbar({ editor, noTopBorder }: Props): JSX.Element {
  const border = noTopBorder ? "border-b" : "border-y";

  return (
    <div className="sticky bg-surface-base z-10 rounded-t-lg top-0">
      <div className={"flex items-center gap-3 border-stroke-base" + " " + border}>
        <div className="flex justify-between items-center w-full">
          <div className="flex items-center">
            <BoldButton editor={editor} iconSize={20} />
            <ItalicButton editor={editor} iconSize={20} />
            <StrikeButton editor={editor} iconSize={20} />

            <Separator />

            <H1Button editor={editor} iconSize={20} />
            <H2Button editor={editor} iconSize={20} />

            <Separator />
            <Brush editor={editor} iconSize={18} />
            <Separator />

            <BulletListButton editor={editor} iconSize={20} />
            <NumberListButton editor={editor} iconSize={20} />
            <BlockquoteButton editor={editor} iconSize={20} />
            <CodeBlockButton editor={editor} iconSize={20} />
            <DividerButton editor={editor} iconSize={20} />

            <Separator />
            <LinkButton editor={editor} iconSize={20} />
          </div>

          <div className="flex items-center gap-1">
            <AttachmentButton editor={editor} iconSize={20} />
            <Separator />
            <UndoButton editor={editor} iconSize={20} />
            <RedoButton editor={editor} iconSize={20} />
          </div>
        </div>
      </div>

      <LinkEditForm editor={editor} />
    </div>
  );
}

function Separator(): React.ReactElement {
  return <div className="border-l border-stroke-base h-4 mx-2" />;
}
