import hotkeys, { type KeyHandler } from "hotkeys-js";

type EditorShortcut = {
  keys: string;
  matches(event: KeyboardEvent): boolean;
};

const bindings = new Set<EditorShortcut & { element: HTMLElement }>();
let originalFilter = hotkeys.filter;

// Hotkeys ignores editable content by default. Allow only shortcuts registered for this editor.
const filter = (event: KeyboardEvent) => {
  const target = event.target;
  if (
    target instanceof Node &&
    Array.from(bindings).some((binding) => binding.matches(event) && binding.element.contains(target))
  ) {
    return true;
  }

  return originalFilter(event);
};

const tableShortcut: EditorShortcut = {
  keys: "alt+f10,shift+f10",
  matches: (event) => event.key === "F10" && (event.altKey || event.shiftKey),
};

const linkShortcut: EditorShortcut = {
  keys: "ctrl+k,command+k",
  matches: isLinkShortcut,
};

export function isLinkShortcut(event: KeyboardEvent) {
  return event.key.toLowerCase() === "k" && (event.ctrlKey || event.metaKey) && !event.altKey && !event.shiftKey;
}

export function bindTableKeyboard(element: HTMLElement, handler: KeyHandler) {
  return bindEditorKeyboard(element, tableShortcut, handler);
}

export function bindLinkKeyboard(element: HTMLElement, handler: KeyHandler) {
  return bindEditorKeyboard(element, linkShortcut, handler);
}

function bindEditorKeyboard(element: HTMLElement, shortcut: EditorShortcut, handler: KeyHandler) {
  if (!bindings.size) {
    originalFilter = hotkeys.filter;
    hotkeys.filter = filter;
  }
  const binding = { ...shortcut, element };
  bindings.add(binding);
  hotkeys(shortcut.keys, { element, capture: true }, handler);

  return () => {
    hotkeys.unbind(shortcut.keys, handler);
    bindings.delete(binding);
    if (!bindings.size && hotkeys.filter === filter) hotkeys.filter = originalFilter;
  };
}
