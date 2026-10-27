import React from "react";
import { useTranslation } from "react-i18next";
import * as Popover from "../../Embedding/Popover";
import { Tooltip } from "../../Tooltip";
import { IconKeyboard, IconX } from "../../icons";
import { ToolbarButton } from "./ToolbarButton";

export const markdownHelpPopoverClassName =
  "z-[100] flex w-96 max-w-[calc(100vw-1rem)] max-h-[var(--radix-popover-content-available-height)] flex-col overflow-hidden rounded-xl border border-stroke-base bg-surface-base text-content-accent shadow-lg";

export function MarkdownHelp() {
  const { t } = useTranslation();
  const [open, setOpen] = React.useState(false);
  const titleId = React.useId();
  const contentRef = React.useRef<HTMLDivElement>(null);

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Tooltip content={t("Markdown shortcuts")} size="sm" disabled={open}>
        <Popover.Trigger asChild>
          <ToolbarButton
            title={t("Markdown shortcuts")}
            aria-label={t("Markdown shortcuts")}
            testId="toolbar-button-markdown-shortcuts"
            tabIndex={0}
            onMouseDown={(event) => event.preventDefault()}
          >
            <IconKeyboard size={20} className="shrink-0" />
          </ToolbarButton>
        </Popover.Trigger>
      </Tooltip>
      <Popover.Portal>
        <Popover.Content
          ref={contentRef}
          aria-labelledby={titleId}
          side="bottom"
          align="end"
          sideOffset={8}
          collisionPadding={8}
          className={markdownHelpPopoverClassName}
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            contentRef.current?.focus();
          }}
        >
          <MarkdownHelpContent titleId={titleId} />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

export function MarkdownHelpContent({ titleId }: { titleId: string }) {
  const { t } = useTranslation();
  const groups: { id: string; shortcuts: Shortcut[] }[] = [
    {
      id: "inline",
      shortcuts: [
        { syntax: "**text**", result: t("Bold") },
        { syntax: "*text*", result: t("Italic") },
        { syntax: "~~text~~", result: t("Strikethrough") },
        { syntax: "==text==", result: t("Highlight") },
        { syntax: "[label](url)", result: t("Link") },
      ],
    },
    {
      id: "headings",
      shortcuts: [
        { syntax: "#", result: t("Heading {{level}}", { level: 1 }), space: true },
        { syntax: "##", result: t("Heading {{level}}", { level: 2 }), space: true },
        { syntax: "###", result: t("Heading {{level}}", { level: 3 }), space: true },
        { syntax: "####", result: t("Heading {{level}}", { level: 4 }), space: true },
      ],
    },
    {
      id: "blocks",
      shortcuts: [
        { syntax: t("{{first}} or {{second}}", { first: "-", second: "*" }), result: t("Bulleted list"), space: true },
        { syntax: "1.", result: t("Numbered list"), space: true },
        { syntax: ">", result: t("Quote"), space: true },
        { syntax: "```", result: t("Code block"), space: true },
      ],
    },
  ];

  return (
    <>
      <div className="shrink-0 px-5 pb-3 pt-4">
        <div className="flex items-center justify-between gap-3">
          <h2 id={titleId} className="text-base font-semibold">
            {t("Markdown shortcuts")}
          </h2>
          <Popover.Close asChild>
            <ToolbarButton title={t("Close")} aria-label={t("Close")} tabIndex={0} className="-mr-1.5">
              <IconX size={18} />
            </ToolbarButton>
          </Popover.Close>
        </div>
        <p className="mt-1 text-sm leading-snug text-content-dimmed">
          {t("Format text as you type using these shortcuts.")}
        </p>
      </div>
      <div className="min-h-0 overflow-y-auto px-5 pb-2">
        <table className="w-full text-left text-sm" aria-labelledby={titleId}>
          {groups.map(({ id, shortcuts }) => (
            <tbody
              key={id}
              className="border-t border-stroke-dimmed first:border-0 [&>tr:first-child>td]:pt-2 [&>tr:last-child>td]:pb-2"
            >
              {shortcuts.map((shortcut) => (
                <ShortcutRow key={shortcut.syntax} shortcut={shortcut} />
              ))}
            </tbody>
          ))}
        </table>
      </div>
    </>
  );
}

interface Shortcut {
  syntax: string;
  result: string;
  space?: boolean;
}

function ShortcutRow({ shortcut }: { shortcut: Shortcut }) {
  const { t } = useTranslation();

  return (
    <tr>
      <td className="py-1 pr-3">{shortcut.result}</td>
      <td className="py-1 text-right">
        <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
          <code className="font-mono text-xs text-content-dimmed">{shortcut.syntax}</code>
          {shortcut.space && (
            <>
              <span className="text-xs text-content-subtle">+</span>
              <kbd className="rounded border border-stroke-base bg-surface-dimmed px-1.5 py-0.5 font-sans text-xs leading-none text-content-dimmed">
                {t("Space", { context: "keyboard key" })}
              </kbd>
            </>
          )}
        </span>
      </td>
    </tr>
  );
}
