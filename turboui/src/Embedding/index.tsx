import React from "react";

export interface EmbeddingEnvironment {
  /** A positioned container in the same DOM or shadow root as the embedded UI. */
  portalContainer: HTMLElement;
  /** The preview viewport whose scrolling is locked while an embedded dialog is open. */
  scrollContainer: HTMLElement;
  /** Defaults to true. Set false to preserve the host page title. */
  manageDocumentTitle?: boolean;
}

interface EmbeddingContextValue extends EmbeddingEnvironment {
  lastPointerTarget: React.MutableRefObject<HTMLElement | null>;
}

const EmbeddingContext = React.createContext<EmbeddingContextValue | null>(null);

export function EmbeddingProvider({ children, ...environment }: EmbeddingEnvironment & { children: React.ReactNode }) {
  const lastPointerTarget = React.useRef<HTMLElement | null>(null);
  const value = React.useMemo(
    () => ({ ...environment, lastPointerTarget }),
    [environment.portalContainer, environment.scrollContainer, environment.manageDocumentTitle],
  );

  React.useEffect(() => {
    const root = environment.portalContainer.getRootNode();
    const rememberOpener = (event: Event) => {
      // WebKit does not focus clicked buttons; retain the real target across shadow retargeting.
      const target = event.composedPath()[0];
      lastPointerTarget.current =
        target instanceof Element ? target.closest<HTMLElement>('button, a[href], input, [tabindex="0"]') : null;
    };
    root.addEventListener("pointerdown", rememberOpener, true);
    return () => root.removeEventListener("pointerdown", rememberOpener, true);
  }, [environment.portalContainer]);

  return <EmbeddingContext.Provider value={value}>{children}</EmbeddingContext.Provider>;
}

export function useEmbedding() {
  return React.useContext(EmbeddingContext);
}

export function activeElement(root: Document | ShadowRoot): Element | null {
  const element = root.activeElement;
  return element?.shadowRoot ? activeElement(element.shadowRoot) : element;
}

type Rect = { left: number; top: number; width?: number; height?: number };

/** Convert viewport coordinates to the unscaled coordinates of an embedded portal. */
export function portalRect(rect: Rect, container?: HTMLElement) {
  if (!container) return rect;
  const bounds = container.getBoundingClientRect();
  const scale = bounds.width / container.offsetWidth || 1;
  return {
    left: (rect.left - bounds.left) / scale,
    top: (rect.top - bounds.top) / scale,
    ...(rect.width === undefined ? {} : { width: rect.width / scale }),
    ...(rect.height === undefined ? {} : { height: rect.height / scale }),
  };
}

/** Position a direct child of the portal layer, independent of any fixed containing block. */
export function portalPosition(rect: Rect, container?: HTMLElement): Rect & { position: "absolute" | "fixed" } {
  if (!container) return { position: "fixed", ...rect };
  const position = portalRect(rect, container);
  return {
    ...position,
    position: "absolute",
    left: position.left - container.clientLeft + container.scrollLeft,
    top: position.top - container.clientTop + container.scrollTop,
  };
}

interface Overlay {
  element: HTMLElement | null;
  previousFocus: Element | null;
}

const overlays = new WeakMap<HTMLElement, Overlay[]>();
const scrollLocks = new WeakMap<HTMLElement, { count: number; overflow: string }>();

function focusFirstControl(element: HTMLElement | null) {
  element?.querySelector<HTMLElement>('input, textarea, button, [tabindex="0"]')?.focus({ preventScroll: true });
}

function lockScroll(container: HTMLElement) {
  const lock = scrollLocks.get(container) ?? { count: 0, overflow: container.style.overflow };
  lock.count += 1;
  scrollLocks.set(container, lock);
  container.style.overflow = "hidden";
  return () => {
    lock.count -= 1;
    if (lock.count === 0) {
      container.style.overflow = lock.overflow;
      scrollLocks.delete(container);
    }
  };
}

/** Embedded dialogs only; unembedded components keep their existing focus and scroll behavior. */
export function useEmbeddedOverlay(isOpen: boolean, onClose: () => void, ref: React.RefObject<HTMLElement>) {
  const embedding = useEmbedding();
  const close = React.useRef(onClose);
  close.current = onClose;

  React.useEffect(() => {
    if (!isOpen || !embedding) return;

    const container = embedding.portalContainer;
    const scroll = embedding.scrollContainer;
    const root = container.getRootNode() as Document | ShadowRoot;
    const focused = activeElement(root);
    const previousFocus =
      focused && focused !== container.ownerDocument.body ? focused : embedding.lastPointerTarget.current;
    const stack = overlays.get(container) ?? [];
    const overlay: Overlay = { element: ref.current, previousFocus };
    stack.push(overlay);
    overlays.set(container, stack);
    const unlock = lockScroll(scroll);

    if (ref.current && !ref.current.contains(activeElement(root))) {
      focusFirstControl(ref.current);
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (stack[stack.length - 1] !== overlay || event.defaultPrevented) return;
      // The path reveals whether the key came from this preview, even inside Shadow DOM.
      if (!event.composedPath().includes(container)) return;
      if (event.key === "Escape") {
        event.preventDefault();
        close.current();
      }
      if (event.key === "Tab" && ref.current) {
        const focused = activeElement(root);
        // A tooltip elsewhere must not disable the trap. Only the focused popup owns Tab.
        // If Radix already handled the key, event.defaultPrevented above takes precedence.
        const boundary = focused?.closest<HTMLElement>("[data-radix-popper-content-wrapper]") ?? ref.current;
        const candidates = Array.from(
          boundary.querySelectorAll<HTMLElement>(
            'button:not(:disabled), a[href], input:not(:disabled), textarea:not(:disabled), [tabindex="0"], [contenteditable="true"]',
          ),
        ).filter(
          (element) =>
            element.getClientRects().length > 0 &&
            element.getAttribute("tabindex") !== "-1" &&
            !element.matches(":disabled"),
        );
        const first = candidates[0];
        const last = candidates[candidates.length - 1];
        if (event.shiftKey && focused === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && focused === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    };

    // Radix claims Escape in capture; our dialogs handle unclaimed events in bubble.
    container.ownerDocument.addEventListener("keydown", onKeyDown);

    return () => {
      const wasTop = stack[stack.length - 1] === overlay;
      stack.splice(stack.indexOf(overlay), 1);
      unlock();
      container.ownerDocument.removeEventListener("keydown", onKeyDown);

      // A child may outlive its parent. Keep its eventual return path to the original opener.
      for (const remaining of stack) {
        if (remaining.previousFocus && overlay.element?.contains(remaining.previousFocus)) {
          remaining.previousFocus = overlay.previousFocus;
        }
      }
      const top = stack[stack.length - 1];
      if (top && !wasTop) return;

      const target = overlay.previousFocus;
      const canRestore = target instanceof HTMLElement && target.isConnected && target !== container.ownerDocument.body;
      if (canRestore && (!top || top.element?.contains(target))) {
        target.focus({ preventScroll: true });
      } else {
        // WebKit may leave no focused opener; keep focus in the remaining dialog instead.
        focusFirstControl(top?.element ?? null);
      }
    };
  }, [isOpen, embedding, ref]);
}
