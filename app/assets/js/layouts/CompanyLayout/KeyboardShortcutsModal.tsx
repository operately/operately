import * as React from "react";

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

const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    title: "Task management",
    shortcuts: [
      { label: "Select next task", keys: [["j"]] },
      { label: "Select previous task", keys: [["k"]] },
      { label: "Open selected task", keys: [["Return"]] },
      { label: "Open assignee picker for the selected task", keys: [["a"]] },
      { label: "Open status picker for the selected task where supported", keys: [["s"]] },
      { label: "Open due date picker for the selected task", keys: [["d"]] },
      { label: "Clear task selection", keys: [["Esc"]] },
    ],
  },
];

export function KeyboardShortcutsModal({ isOpen, onClose }: KeyboardShortcutsModalProps) {
  const shortcutGroups = React.useMemo(() => buildShortcutGroups(), []);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Keyboard Shortcuts Cheatsheet"
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

function buildShortcutGroups(): ShortcutGroup[] {
  return [
    {
      title: "Global",
      shortcuts: [
        { label: "Open global search", keys: [isMacPlatform() ? ["⌘", "k"] : ["Ctrl", "k"]] },
        { label: "Open keyboard shortcuts", keys: [["?"]] },
      ],
    },
    ...SHORTCUT_GROUPS,
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
