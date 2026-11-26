import React from "react";

// When enabled, keep keyboard focus inside the open panel and restore the previous focus on close.
export function useFocusTrap(panelRef: React.RefObject<HTMLDivElement>, enabled: boolean) {
  React.useEffect(() => {
    if (!enabled) return;

    const panel = panelRef.current;
    if (!panel) return;

    const previous = document.activeElement;
    const controls = () =>
      Array.from(
        panel.querySelectorAll<HTMLElement>(
          'button:not(:disabled), a[href], input:not(:disabled), textarea:not(:disabled), [tabindex="0"], [contenteditable="true"]',
        ),
      ).filter((element) => !element.closest("[hidden]"));

    if (!panel.contains(document.activeElement)) controls()[0]?.focus();

    const trap = (event: KeyboardEvent) => {
      if (event.key !== "Tab" || event.defaultPrevented) return;

      const elements = controls();
      const first = elements[0];
      const last = elements[elements.length - 1];

      if (event.shiftKey ? document.activeElement === first : document.activeElement === last) {
        event.preventDefault();
        (event.shiftKey ? last : first)?.focus();
      }
    };
    panel.addEventListener("keydown", trap);

    return () => {
      panel.removeEventListener("keydown", trap);
      if (previous instanceof HTMLElement && previous.isConnected) previous.focus();
    };
  }, [enabled, panelRef]);
}
