import React, { useCallback } from "react";

export function useShortcutFieldFocusRestore(rowRef: React.RefObject<HTMLElement>) {
  const shouldRestoreFocusRef = React.useRef(false);

  const prepareFocusRestore = useCallback(() => {
    shouldRestoreFocusRef.current = true;
  }, []);

  const focusRowAfterFieldClose = useCallback(() => {
    const focusRow = () => {
      const row = rowRef.current;
      if (!row) return;

      const activeElement = document.activeElement;
      if (activeElement instanceof HTMLElement && activeElement !== row && row.contains(activeElement)) {
        activeElement.blur();
      }

      row.focus({ preventScroll: true });
    };

    requestAnimationFrame(() => {
      focusRow();
    });
    window.setTimeout(focusRow, 0);
    window.setTimeout(() => {
      shouldRestoreFocusRef.current = false;
    }, 200);
  }, [rowRef]);

  const restoreFocusOnCloseAutoFocus = useCallback(
    (event: Event) => {
      if (!shouldRestoreFocusRef.current) return;

      event.preventDefault();
      focusRowAfterFieldClose();
    },
    [focusRowAfterFieldClose],
  );

  const restoreFocusAfterOpenChange = useCallback(
    (isOpen: boolean) => {
      if (!isOpen && shouldRestoreFocusRef.current) {
        focusRowAfterFieldClose();
      }
    },
    [focusRowAfterFieldClose],
  );

  return {
    prepareFocusRestore,
    restoreFocusAfterOpenChange,
    restoreFocusOnCloseAutoFocus,
  };
}
