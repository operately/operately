import * as Popover from "@radix-ui/react-popover";
import * as React from "react";

import classNames from "classnames";
import { SecondaryButton } from "../../Button";
import { createTestId } from "../../TestableElement";
import { LucidePaintBucket } from "../../icons";

const DROPDOWN_CLASS = classNames(
  "border border-t-4 border-stroke-base",
  "z-[100] shadow-lg overflow-hidden bg-surface-base px-3 pt-2 pb-3",
);

export function ColorPicker({ editor, iconSize }): React.ReactElement {
  const [open, setOpen] = React.useState(false);

  const testId = createTestId("toolbar-button", "highlight");

  React.useEffect(() => {
    if (open) {
      editor?.chain().setFakeTextSelection().run();
    } else {
      editor?.chain().unsetFakeTextSelection().run();
    }
  }, [open]);

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger className="cursor-pointer" data-test-id={testId} tabIndex={-1}>
        <BucketIcon iconSize={iconSize} editor={editor} />
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content className={DROPDOWN_CLASS} align="center" sideOffset={6}>
          <div className="flex items-center gap-1.5">
            <Option highlight={"textYellow"} editor={editor} />
            <Option highlight={"textOrange"} editor={editor} />
            <Option highlight={"textRed"} editor={editor} />
            <Option highlight={"textPurple"} editor={editor} />
            <Option highlight={"textBlue"} editor={editor} />
            <Option highlight={"textGreen"} editor={editor} />
          </div>

          <div className="flex items-center gap-1.5 mt-1">
            <Option highlight={"bgYellow"} editor={editor} />
            <Option highlight={"bgOrange"} editor={editor} />
            <Option highlight={"bgRed"} editor={editor} />
            <Option highlight={"bgPurple"} editor={editor} />
            <Option highlight={"bgBlue"} editor={editor} />
            <Option highlight={"bgGreen"} editor={editor} />
          </div>

          <ClearOption editor={editor} />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

function BucketIcon({ iconSize, editor }): React.ReactElement {
  const highlight = editor?.getAttributes("highlight")?.highlight || "unset";

  //
  // Here we are using the combination of the ProseMirror and the mark element
  // to highlight the component as the text would be highlighted in the editor.
  //
  // See prosemirror.css for how the styles look and which highlight colors are
  // available.
  //
  return (
    <div className="ProseMirror">
      <mark data-highlight={highlight} className="block px-1 py-0.5 rounded">
        <LucidePaintBucket size={iconSize - 1} />
      </mark>
    </div>
  );
}

function ClearOption({ editor }): React.ReactElement {
  const hasHighlight = editor?.isActive("highlight");

  const handleClick = React.useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    editor.chain().focus().unsetHighlight().run();
  }, []);

  if (hasHighlight) {
    return (
      <div className="mt-4 flex items-center justify-center">
        <SecondaryButton size="xs" onClick={handleClick}>
          Remove Highlight
        </SecondaryButton>
      </div>
    );
  } else {
    return <></>;
  }
}

function Option({ highlight, editor }): React.ReactElement {
  const className = classNames("shrink-0 cursor-pointer px-1.5 py-1.5 leading-none block");

  const handleClick = React.useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    editor.chain().focus().setHighlight({ highlight }).run();
  }, []);

  //
  // Here we are using the combination of the ProseMirror and the mark element
  // to highlight the component as the text would be highlighted in the editor.
  //
  // See prosemirror.css for how the styles look and which highlight colors are
  // available.
  //
  return (
    <div className="ProseMirror" data-test-id={highlight}>
      <mark className={className} onClick={handleClick} data-highlight={highlight}>
        Az
      </mark>
    </div>
  );
}
