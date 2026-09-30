import React from "react";

export interface EmbeddingEnvironment {
  /** A positioned container in the same DOM or shadow root as the embedded UI. */
  portalContainer: HTMLElement;
  scrollContainer: HTMLElement;
  manageDocumentTitle?: boolean;
}

const EmbeddingContext = React.createContext<EmbeddingEnvironment | null>(null);

export function EmbeddingProvider({ children, ...environment }: EmbeddingEnvironment & { children: React.ReactNode }) {
  const value = React.useMemo(
    () => environment,
    [environment.portalContainer, environment.scrollContainer, environment.manageDocumentTitle],
  );
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

const overlays = new WeakMap<HTMLElement, symbol[]>();
const scrollLocks = new WeakMap<HTMLElement, { count: number; overflow: string }>();

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

/** Keep nested dialogs from closing each other or unlocking their parent's scroll. */
export function useOverlay(isOpen: boolean, onClose: () => void, ref: React.RefObject<HTMLElement>) {
  const embedding = useEmbedding();
  const close = React.useRef(onClose);
  close.current = onClose;

  React.useEffect(() => {
    if (!isOpen) return;

    const container = embedding?.portalContainer ?? document.body;
    const scroll = embedding?.scrollContainer ?? document.body;
    const root = container.getRootNode() as Document | ShadowRoot;
    const previousFocus = activeElement(root);
    const stack = overlays.get(container) ?? [];
    const id = Symbol("overlay");
    stack.push(id);
    overlays.set(container, stack);
    const unlock = lockScroll(scroll);

    if (embedding && ref.current && !ref.current.contains(activeElement(root))) {
      ref.current.querySelector<HTMLElement>('input, textarea, button, [tabindex="0"]')?.focus({ preventScroll: true });
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (stack[stack.length - 1] !== id || event.defaultPrevented) return;
      // The path reveals whether the key came from this preview, even inside Shadow DOM.
      if (embedding && !event.composedPath().includes(container)) return;
      if (event.key === "Escape") {
        event.preventDefault();
        close.current();
      }
      if (embedding && event.key === "Tab" && ref.current) {
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
      stack.splice(stack.indexOf(id), 1);
      unlock();
      container.ownerDocument.removeEventListener("keydown", onKeyDown);
      if (embedding && previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus();
    };
  }, [isOpen, embedding, ref]);
}
