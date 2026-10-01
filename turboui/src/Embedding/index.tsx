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

/** Convert viewport coordinates to the unscaled coordinates of an embedded portal. */
export function portalRect(
  rect: { left: number; top: number; width?: number; height?: number },
  container?: HTMLElement,
) {
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

const overlays = new WeakMap<HTMLElement, React.RefObject<HTMLElement>[]>();
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
    stack.push(ref);
    overlays.set(container, stack);
    const unlock = lockScroll(scroll);

    if (ref.current && !ref.current.contains(activeElement(root))) {
      focusFirstControl(ref.current);
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (stack[stack.length - 1] !== ref || event.defaultPrevented) return;
      // The path reveals whether the key came from this preview, even inside Shadow DOM.
      if (!event.composedPath().includes(container)) return;
      if (event.key === "Escape") {
        event.preventDefault();
        close.current();
      }
      if (event.key === "Tab" && ref.current) {
        // Radix controls manage their own focus while a nested popup is open.
        if (container.querySelector("[data-radix-popper-content-wrapper]")) return;
        const candidates = Array.from(
          ref.current.querySelectorAll<HTMLElement>(
            'button:not(:disabled), a[href], input:not(:disabled), textarea:not(:disabled), [tabindex="0"], [contenteditable="true"]',
          ),
        ).filter((element) => element.getClientRects().length > 0);
        const first = candidates[0];
        const last = candidates[candidates.length - 1];
        const focused = activeElement(root);
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
      stack.splice(stack.indexOf(ref), 1);
      unlock();
      container.ownerDocument.removeEventListener("keydown", onKeyDown);
      if (
        previousFocus instanceof HTMLElement &&
        previousFocus.isConnected &&
        previousFocus !== container.ownerDocument.body
      ) {
        previousFocus.focus({ preventScroll: true });
      } else {
        // WebKit may leave no focused element after a pointer click on the opener.
        focusFirstControl(stack[stack.length - 1]?.current ?? null);
      }
    };
  }, [isOpen, embedding, ref]);
}
