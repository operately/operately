import * as React from "react";
import * as Popover from "@radix-ui/react-popover";

import { PaintBucket } from "lucide-react";
import classNames from "classnames";

const DROPDOWN_CLASS = classNames(
  "border border-t-4 border-stroke-base",
  "z-[100] shadow-lg overflow-hidden bg-surface-base px-3 pt-2 pb-3",
);

export function ColorPicker({ editor, iconSize }): React.ReactElement {
  return (
    <Popover.Root>
      <Popover.Trigger className="cursor-pointer">
        <BucketIcon iconSize={iconSize} editor={editor} />
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content className={DROPDOWN_CLASS} align="center" sideOffset={6}>
          <div className="flex items-center gap-1.5">
            <Option color={"textYellow"} editor={editor} />
            <Option color={"textOrange"} editor={editor} />
            <Option color={"textRed"} editor={editor} />
            <Option color={"textPurple"} editor={editor} />
            <Option color={"textBlue"} editor={editor} />
            <Option color={"textGreen"} editor={editor} />
          </div>

          <div className="flex items-center gap-1.5 mt-1">
            <Option color={"bgYellow"} editor={editor} />
            <Option color={"bgOrange"} editor={editor} />
            <Option color={"bgRed"} editor={editor} />
            <Option color={"bgPurple"} editor={editor} />
            <Option color={"bgBlue"} editor={editor} />
            <Option color={"bgGreen"} editor={editor} />
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

function BucketIcon({ iconSize, editor }): React.ReactElement {
  const color = editor?.getAttributes("highlight")?.color || "unset";

  //
  // Here we are using the combination of the ProseMirror and the mark element
  // to highlight the component as the text would be highlighted in the editor.
  //
  // See prosemirror.css for how the styles look and which highlight colors are
  // available.
  //
  return (
    <div className="ProseMirror">
      <mark data-highlight={color} className="block px-1 py-0.5 rounded">
        <PaintBucket size={iconSize - 1} />
      </mark>
    </div>
  );
}

function Option({ color, editor }): React.ReactElement {
  const className = classNames("shrink-0 cursor-pointer px-1.5 py-1.5 leading-none block");

  const handleClick = React.useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    editor.chain().focus().setHighlight({ color }).run();
  }, []);

  //
  // Here we are using the combination of the ProseMirror and the mark element
  // to highlight the component as the text would be highlighted in the editor.
  //
  // See prosemirror.css for how the styles look and which highlight colors are
  // available.
  //
  return (
    <div className="ProseMirror">
      <mark className={className} onClick={handleClick} data-highlight={color}>
        Az
      </mark>
    </div>
  );
}
