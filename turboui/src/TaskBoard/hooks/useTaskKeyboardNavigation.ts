import React from "react";
import hotkeys from "hotkeys-js";

export const TASK_ROW_SELECTOR = "[data-task-row-id]";
export const OPEN_TASK_ASSIGNEE_EVENT = "taskboard:open-assignee";

type Direction = "down" | "up";

let nextNavigationScopeId = 0;
let activeNavigationScopeId: number | null = null;

export function useTaskKeyboardNavigation<TElement extends HTMLElement>() {
  const containerRef = React.useRef<TElement | null>(null);
  const scopeIdRef = React.useRef<number | null>(null);
  const [selectedTaskId, setSelectedTaskId] = React.useState<string | null>(null);
  const selectedTaskIdRef = React.useRef<string | null>(null);

  if (scopeIdRef.current === null) {
    scopeIdRef.current = ++nextNavigationScopeId;
  }

  React.useEffect(() => {
    selectedTaskIdRef.current = selectedTaskId;
  }, [selectedTaskId]);

  React.useEffect(() => {
    activeNavigationScopeId = scopeIdRef.current;

    return () => {
      if (activeNavigationScopeId === scopeIdRef.current) {
        activeNavigationScopeId = null;
      }
    };
  }, []);

  const activateScope = React.useCallback(() => {
    activeNavigationScopeId = scopeIdRef.current;
  }, []);

  const clearSelection = React.useCallback(() => {
    setSelectedTaskId(null);

    if (
      document.activeElement instanceof HTMLElement &&
      document.activeElement.closest(TASK_ROW_SELECTOR)
    ) {
      document.activeElement.blur();
    }
  }, []);

  const scopeBind = React.useMemo(
    () => ({
      onFocusCapture: activateScope,
      onMouseEnter: activateScope,
    }),
    [activateScope],
  );

  const selectTask = React.useCallback((direction: Direction) => {
    const rows = getTaskRows(containerRef.current);
    if (rows.length === 0) return false;

    const currentIndex = rows.findIndex((row) => row.dataset.taskRowId === selectedTaskIdRef.current);
    const nextIndex = getNextIndex(currentIndex, rows.length, direction);
    const nextRow = rows[nextIndex];
    const nextTaskId = nextRow?.dataset.taskRowId;

    if (!nextRow || !nextTaskId) return false;

    setSelectedTaskId(nextTaskId);

    requestAnimationFrame(() => {
      nextRow.focus({ preventScroll: true });
      nextRow.scrollIntoView({ block: "nearest" });
    });

    return true;
  }, []);

  React.useEffect(() => {
    const handleKey = (event: KeyboardEvent, direction: Direction) => {
      if (event.defaultPrevented || shouldIgnoreKeyboardEvent(event)) return;
      if (!isInNavigationScope(event, containerRef.current, scopeIdRef.current)) return;

      activateScope();

      const handled = selectTask(direction);

      if (!handled) return;

      event.preventDefault();
      try {
        (event as Event).stopImmediatePropagation();
      } catch {
        event.stopPropagation();
      }
    };
    const clearSelectionWithEscape = (event: KeyboardEvent) => {
      if (event.defaultPrevented || shouldIgnoreKeyboardEvent(event)) return;
      if (!selectedTaskIdRef.current) return;
      if (!isInNavigationScope(event, containerRef.current, scopeIdRef.current)) return;

      activateScope();

      clearSelection();

      event.preventDefault();
      try {
        (event as Event).stopImmediatePropagation();
      } catch {
        event.stopPropagation();
      }
    };
    const selectNextTask = (event: KeyboardEvent) => handleKey(event, "down");
    const selectPreviousTask = (event: KeyboardEvent) => handleKey(event, "up");
    const openAssigneeSelector = (event: KeyboardEvent) => {
      if (event.defaultPrevented || shouldIgnoreKeyboardEvent(event)) return;
      if (!isInNavigationScope(event, containerRef.current, scopeIdRef.current)) return;

      const row = getSelectedTaskRow(containerRef.current, selectedTaskIdRef.current);
      if (!row) return;

      activateScope();
      row.dispatchEvent(new Event(OPEN_TASK_ASSIGNEE_EVENT));

      event.preventDefault();
      try {
        (event as Event).stopImmediatePropagation();
      } catch {
        event.stopPropagation();
      }
    };

    hotkeys("j", selectNextTask);
    hotkeys("k", selectPreviousTask);
    hotkeys("a", openAssigneeSelector);
    hotkeys("esc", clearSelectionWithEscape);
    return () => {
      hotkeys.unbind("j", selectNextTask);
      hotkeys.unbind("k", selectPreviousTask);
      hotkeys.unbind("a", openAssigneeSelector);
      hotkeys.unbind("esc", clearSelectionWithEscape);
    };
  }, [activateScope, clearSelection, selectTask]);

  return { containerRef, selectedTaskId, clearSelection, scopeBind } as const;
}

function getTaskRows(container: HTMLElement | null): HTMLElement[] {
  if (!container) return [];

  return Array.from(container.querySelectorAll<HTMLElement>(TASK_ROW_SELECTOR));
}

function getSelectedTaskRow(container: HTMLElement | null, selectedTaskId: string | null): HTMLElement | null {
  if (!selectedTaskId) return null;

  return getTaskRows(container).find((row) => row.dataset.taskRowId === selectedTaskId) ?? null;
}

function getNextIndex(currentIndex: number, rowsCount: number, direction: Direction): number {
  if (currentIndex === -1) return 0;

  if (direction === "down") {
    return Math.min(currentIndex + 1, rowsCount - 1);
  } else {
    return Math.max(currentIndex - 1, 0);
  }
}

function shouldIgnoreKeyboardEvent(event: KeyboardEvent): boolean {
  if (event.altKey || event.ctrlKey || event.metaKey) return true;

  const target = event.target;
  if (!(target instanceof HTMLElement)) return false;

  const tag = target.tagName;
  if (target.isContentEditable || tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  if (target.closest(TASK_ROW_SELECTOR)) return false;

  return Boolean(target.closest("button, a, [role='button'], [role='menuitem'], [aria-haspopup='menu']"));
}

function isInNavigationScope(event: KeyboardEvent, container: HTMLElement | null, scopeId: number | null): boolean {
  if (!container) return false;

  const target = event.target;
  if (target instanceof Node && container.contains(target)) return true;

  const activeElement = document.activeElement;
  if (activeElement instanceof HTMLElement && container.contains(activeElement)) return true;

  return (
    scopeId !== null &&
    activeNavigationScopeId === scopeId &&
    isNeutralDocumentTarget(target) &&
    isNeutralActiveElement(activeElement)
  );
}

function isNeutralDocumentTarget(target: EventTarget | null): boolean {
  return target === document || target === document.body || target === document.documentElement;
}

function isNeutralActiveElement(activeElement: Element | null): boolean {
  return !activeElement || activeElement === document.body || activeElement === document.documentElement;
}
