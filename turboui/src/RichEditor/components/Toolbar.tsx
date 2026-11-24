import { useTranslation } from "react-i18next";
import * as Popover from "../../Embedding/Popover";
import { IconChevronDown, IconKeyboard } from "../../icons";
import * as React from "react";

import { AttachmentButton } from "./AttachmentButton";
import { BlockquoteButton } from "./BlockquoteButton";
import { BoldButton } from "./BoldButton";
import { BulletListButton } from "./BulletListButton";
import { HeadingButtons } from "./HeadingButtons";
import { ItalicButton } from "./ItalicButton";
import { LinkButton } from "./LinkButton";
import { NumberListButton } from "./NumberListButton";
import { TaskListButton } from "./TaskListButton";
import { TableButton } from "./TableButton";
import { RedoButton } from "./RedoButton";
import { StrikeButton } from "./StrikeButton";
import { UndoButton } from "./UndoButton";

import { useWindowSizeBreakpoints } from "../../utils/useWindowSizeBreakpoint";
import { useTipTapEditor, useUploadFile } from "../EditorContext";
import { LinkEditForm } from "../LinkEditForm";
import { CodeBlockButton } from "./CodeBlockButton";
import { ColorPicker } from "./ColorPicker";
import { DividerButton } from "./DividerButton";
import { MarkdownHelp, MarkdownHelpContent, markdownHelpPopoverClassName } from "./MarkdownHelp";
import { ToolbarButton } from "./ToolbarButton";
import { MermaidButton } from "./MermaidButton";

export function Toolbar({ compact }: { compact?: boolean } = {}): JSX.Element {
  const size = useWindowSizeBreakpoints();
  const editor = useTipTapEditor();
  const isCompactToolbar = compact || size === "xs";

  return (
    <div className="sticky bg-surface-base z-10 rounded-t-lg top-0" data-test-id="rich-editor-toolbar">
      {isCompactToolbar ? <MobileToolbar /> : <DesktopToolbar />}
      <LinkEditForm editor={editor} />
    </div>
  );
}

function DesktopToolbar() {
  const editor = useTipTapEditor();
  const uploadFile = useUploadFile();

  return (
    <div className="flex flex-wrap items-start border-stroke-base border-b">
      <div className="flex flex-1 flex-wrap items-center min-w-0">
        <BoldButton editor={editor} iconSize={20} />
        <ItalicButton editor={editor} iconSize={20} />
        <StrikeButton editor={editor} iconSize={20} />

        <Separator />

        <HeadingButtons editor={editor} iconSize={20} />

        <Separator />
        <ColorPicker editor={editor} iconSize={18} />
        <Separator />

        <BulletListButton editor={editor} iconSize={20} />
        <NumberListButton editor={editor} iconSize={20} />
        <TaskListButton editor={editor} iconSize={20} />
        <TableButton editor={editor} iconSize={20} />
        <BlockquoteButton editor={editor} iconSize={20} />
        <CodeBlockButton editor={editor} iconSize={20} />
        <MermaidButton editor={editor} iconSize={20} />
        <DividerButton editor={editor} iconSize={20} />

        <Separator />
        <LinkButton editor={editor} iconSize={20} />
        <Separator />
        <MarkdownHelp />
      </div>

      <div className="flex items-center gap-1 ml-auto">
        {uploadFile ? (
          <>
            <AttachmentButton editor={editor} iconSize={20} />
            <Separator />
          </>
        ) : null}
        <UndoButton editor={editor} iconSize={20} />
        <RedoButton editor={editor} iconSize={20} />
      </div>
    </div>
  );
}

function MobileToolbar() {
  const editor = useTipTapEditor();
  const uploadFile = useUploadFile();

  return (
    <div className="flex items-center gap-3 border-y border-stroke-base">
      <div className="flex justify-between items-center w-full min-w-0">
        <div className="flex flex-1 items-center min-w-0" data-test-id="rich-editor-primary-controls">
          <BoldButton editor={editor} iconSize={20} />
          <ItalicButton editor={editor} iconSize={20} />
          <StrikeButton editor={editor} iconSize={20} />
          {uploadFile ? <AttachmentButton editor={editor} iconSize={20} /> : null}
        </div>

        <div className="flex shrink-0 items-center">
          <MobilePopupTools>
            <TableButton editor={editor} iconSize={20} tabIndex={0} />
            <HeadingButtons editor={editor} iconSize={20} />
            <ColorPicker editor={editor} iconSize={18} />
            <BulletListButton editor={editor} iconSize={20} />
            <TaskListButton editor={editor} iconSize={20} />
            <NumberListButton editor={editor} iconSize={20} />
            <BlockquoteButton editor={editor} iconSize={20} />
            <CodeBlockButton editor={editor} iconSize={20} />
            <MermaidButton editor={editor} iconSize={20} />
            <DividerButton editor={editor} iconSize={20} />
            <LinkButton editor={editor} iconSize={20} />
            <UndoButton editor={editor} iconSize={20} />
            <RedoButton editor={editor} iconSize={20} />
          </MobilePopupTools>
        </div>
      </div>
    </div>
  );
}

function MobilePopupTools({ children }: { children: React.ReactNode }): JSX.Element {
  const { t } = useTranslation();
  const [showMarkdownHelp, setShowMarkdownHelp] = React.useState(false);
  const helpTitleId = React.useId();
  const contentRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (showMarkdownHelp) contentRef.current?.focus();
  }, [showMarkdownHelp]);

  return (
    <Popover.Root
      onOpenChange={(open) => {
        if (!open) setShowMarkdownHelp(false);
      }}
    >
      <Popover.Trigger className="mr-2" aria-label={t("More formatting options")} data-test-id="rich-editor-overflow">
        <IconChevronDown size={20} />
      </Popover.Trigger>
      <Popover.Content
        ref={contentRef}
        aria-labelledby={showMarkdownHelp ? helpTitleId : undefined}
        align="end"
        collisionPadding={8}
        className={
          showMarkdownHelp
            ? markdownHelpPopoverClassName
            : "z-10 p-2 max-w-[calc(100vw-1rem)] bg-surface-base rounded-lg shadow-lg border border-stroke-base"
        }
      >
        {showMarkdownHelp ? (
          <MarkdownHelpContent titleId={helpTitleId} />
        ) : (
          <>
            <div className="flex flex-wrap gap-1">{children}</div>
            <div className="mt-2 border-t border-stroke-base pt-2">
              <ToolbarButton
                title={t("Markdown shortcuts")}
                aria-label={t("Markdown shortcuts")}
                testId="toolbar-button-markdown-shortcuts"
                tabIndex={0}
                className="flex w-full items-center gap-2 text-left"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => setShowMarkdownHelp(true)}
              >
                <IconKeyboard size={20} className="shrink-0" />
                {t("Markdown shortcuts")}
              </ToolbarButton>
            </div>
          </>
        )}
      </Popover.Content>
    </Popover.Root>
  );
}

function Separator(): React.ReactElement {
  return <div className="border-l border-stroke-base h-4 mx-1" />;
}
