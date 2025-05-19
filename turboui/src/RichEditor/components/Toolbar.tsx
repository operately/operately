import * as Popover from "@radix-ui/react-popover";
import * as Icons from "@tabler/icons-react";
import * as React from "react";

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

import { useWindowSizeBreakpoints } from "../../utils/useWindowSizeBreakpoint";
import { useTipTapEditor } from "../EditorContext";
import { LinkEditForm } from "../LinkEditForm";
import { CodeBlockButton } from "./CodeBlockButton";
import { ColorPicker } from "./ColorPicker";
import { DividerButton } from "./DividerButton";

export function Toolbar(): JSX.Element {
  const size = useWindowSizeBreakpoints();

  if (size == "xs") {
    return <MobileToolbar />;
  } else {
    return <DesktopToolbar />;
  }
}

function DesktopToolbar() {
  const editor = useTipTapEditor();
  const border = "border-y";

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
            <ColorPicker editor={editor} iconSize={18} />
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

function MobileToolbar() {
  const border = "border-y";
  const editor = useTipTapEditor();

  return (
    <div className="sticky bg-surface-base z-10 rounded-t-lg top-0">
      <div className={"flex items-center gap-3 border-stroke-base" + " " + border}>
        <div className="flex justify-between items-center w-full">
          <div className="flex items-center">
            <BoldButton editor={editor} iconSize={20} />
            <ItalicButton editor={editor} iconSize={20} />
            <StrikeButton editor={editor} iconSize={20} />
            <H1Button editor={editor} iconSize={20} />
            <H2Button editor={editor} iconSize={20} />
            <ColorPicker editor={editor} iconSize={18} />
            <BulletListButton editor={editor} iconSize={20} />
            <AttachmentButton editor={editor} iconSize={20} />
          </div>

          <MobilePopupTools>
            <NumberListButton editor={editor} iconSize={20} />
            <BlockquoteButton editor={editor} iconSize={20} />
            <CodeBlockButton editor={editor} iconSize={20} />
            <DividerButton editor={editor} iconSize={20} />
            <LinkButton editor={editor} iconSize={20} />
            <UndoButton editor={editor} iconSize={20} />
            <RedoButton editor={editor} iconSize={20} />
          </MobilePopupTools>
        </div>
      </div>

      <LinkEditForm editor={editor} />
    </div>
  );
}

function MobilePopupTools({ children }: { children: React.ReactNode }): JSX.Element {
  return (
    <Popover.Root>
      <Popover.Trigger className="mr-2">
        <Icons.IconChevronDown size={20} />
      </Popover.Trigger>
      <Popover.Content className="z-10 p-2 bg-surface-base rounded-lg shadow-lg border border-stroke-base">
        <div className="flex flex-wrap gap-1">{children}</div>
      </Popover.Content>
    </Popover.Root>
  );
}

function Separator(): React.ReactElement {
  return <div className="border-l border-stroke-base h-4 mx-2" />;
}
