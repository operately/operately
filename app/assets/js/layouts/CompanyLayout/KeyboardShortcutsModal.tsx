import * as React from "react";
import { useTranslation } from "react-i18next";
import { translationText } from "@/i18n";

import { Modal } from "turboui";

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ShortcutGroup {
  title: string;
  shortcuts: Shortcut[];
}

interface Shortcut {
  label: string;
  keys: string[][];
}

export function KeyboardShortcutsModal({ isOpen, onClose }: KeyboardShortcutsModalProps) {
  const { t } = useTranslation();
  const shortcutGroups = React.useMemo(() => buildShortcutGroups((key) => translationText(t(key))), [t]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={translationText(t("Keyboard Shortcuts Cheatsheet"))}
      size="small"
      contentPadding="px-[26px] py-6"
    >
      <div className="space-y-7">
        {shortcutGroups.map((group) => (
          <section key={group.title}>
            <h2 className="font-bold text-sm mb-2">{group.title}</h2>

            <div className="divide-y divide-stroke-base">
              {group.shortcuts.map((shortcut) => (
                <ShortcutRow key={shortcut.label} shortcut={shortcut} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </Modal>
  );
}

function ShortcutRow({ shortcut }: { shortcut: Shortcut }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="text-content-accent leading-snug">{shortcut.label}</div>

      <div className="flex flex-wrap items-center justify-end gap-1.5 shrink-0">
        {shortcut.keys.map((keySequence) => (
          <ShortcutKeySequence key={keySequence.join("+")} keys={keySequence} />
        ))}
      </div>
    </div>
  );
}

function ShortcutKeySequence({ keys }: { keys: string[] }) {
  return (
    <div className="flex items-center gap-1">
      {keys.map((key) => (
        <kbd
          key={key}
          className="min-w-7 h-7 px-2 inline-flex items-center justify-center rounded-md border border-surface-outline bg-surface-bg text-sm font-medium leading-none text-content-accent shadow-sm"
        >
          <span className={key === "⌘" ? "text-lg leading-none" : undefined}>{key}</span>
        </kbd>
      ))}
    </div>
  );
}

function buildShortcutGroups(t: (key: string) => string): ShortcutGroup[] {
  return [
    {
      title: t("Global"),
      shortcuts: [
        { label: t("Open global search"), keys: [isMacPlatform() ? ["⌘", "k"] : [t("Ctrl"), "k"]] },
        { label: t("Open keyboard shortcuts"), keys: [["?"]] },
      ],
    },
    {
      title: t("Task management"),
      shortcuts: [
        { label: t("Select next task"), keys: [["j"]] },
        { label: t("Select previous task"), keys: [["k"]] },
        { label: t("Open selected task"), keys: [[t("Return")]] },
        { label: t("Open assignee picker for the selected task"), keys: [["a"]] },
        { label: t("Open status picker for the selected task where supported"), keys: [["s"]] },
        { label: t("Open due date picker for the selected task"), keys: [["d"]] },
        { label: t("Clear task selection"), keys: [[t("Esc")]] },
      ],
    },
  ];
}

function isMacPlatform(): boolean {
  const platform = window.navigator.platform.toLowerCase();

  return platform.includes("mac");
}

export function useKeyboardShortcutsModal() {
  const [isOpen, setIsOpen] = React.useState(false);

  const open = React.useCallback(() => setIsOpen(true), []);
  const close = React.useCallback(() => setIsOpen(false), []);

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isKeyboardShortcutsEvent(event)) return;

      event.preventDefault();
      open();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  return { isOpen, open, close };
}

function isKeyboardShortcutsEvent(event: KeyboardEvent): boolean {
  if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return false;
  if (event.key !== "?" && !(event.shiftKey && event.key === "/")) return false;

  const target = event.target;
  if (!(target instanceof HTMLElement)) return true;

  const tag = target.tagName;
  if (target.isContentEditable || tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return false;

  return !target.closest("button, a, [role='button'], [role='menuitem'], [aria-haspopup='menu']");
}
