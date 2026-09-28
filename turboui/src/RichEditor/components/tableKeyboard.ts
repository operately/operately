import hotkeys, { type KeyHandler } from "hotkeys-js";

const editors = new Set<HTMLElement>();
let originalFilter = hotkeys.filter;

// Hotkeys ignores editable content by default. Allow only these two editor shortcuts.
const filter = (event: KeyboardEvent) => {
  if (
    event.key === "F10" &&
    (event.altKey || event.shiftKey) &&
    event.target instanceof Node &&
    Array.from(editors).some((element) => element.contains(event.target as Node))
  )
    return true;

  return originalFilter(event);
};

export function bindTableKeyboard(element: HTMLElement, handler: KeyHandler) {
  if (!editors.size) {
    originalFilter = hotkeys.filter;
    hotkeys.filter = filter;
  }
  editors.add(element);
  hotkeys("alt+f10,shift+f10", { element, capture: true }, handler);

  return () => {
    hotkeys.unbind("alt+f10,shift+f10", handler);
    editors.delete(element);
    if (!editors.size && hotkeys.filter === filter) hotkeys.filter = originalFilter;
  };
}
