import type { PagePreloader } from "./preloadPage";
import { subscribePreloadSession } from "./preloadSession";

const HOVER_DELAY_MS = 150;

/** Delegation also covers links inserted after mount and their nested content. */
export function listenForPagePreloads(preloader: PagePreloader, document: Document) {
  const timers = new Map<"pointer" | "focus", { anchor: HTMLAnchorElement; timer: ReturnType<typeof setTimeout> }>();
  let keyboardFocus = true;

  function anchorAt(target: EventTarget | null) {
    return target instanceof Element ? target.closest<HTMLAnchorElement>("a[href]") : null;
  }

  function eligible(anchor: HTMLAnchorElement) {
    const target = anchor.target || document.querySelector("base")?.target;
    return (
      anchor.isConnected &&
      !anchor.hasAttribute("download") &&
      (!target || target === "_self") &&
      !anchor.closest('[data-preload="false"]') &&
      preloader.isEligible(anchor.href)
    );
  }

  function cancel(kind: "pointer" | "focus") {
    clearTimeout(timers.get(kind)?.timer);
    timers.delete(kind);
  }

  function cancelAll() {
    cancel("pointer");
    cancel("focus");
  }

  function schedule(kind: "pointer" | "focus", anchor: HTMLAnchorElement | null) {
    if (timers.get(kind)?.anchor === anchor) return;

    cancel(kind);

    if (!anchor || !eligible(anchor)) return;

    const scope = preloader.scope();
    const href = anchor.href;

    const timer = setTimeout(() => {
      timers.delete(kind);
      if (anchor.href === href && preloader.scope() === scope && eligible(anchor)) void preloader.preloadPage(href);
    }, HOVER_DELAY_MS);
    timers.set(kind, { anchor, timer });
  }

  const pointerOver = (event: PointerEvent) => {
    if (event.pointerType === "touch") return;
    const anchor = anchorAt(event.target);
    if (anchor !== anchorAt(event.relatedTarget)) schedule("pointer", anchor);
  };
  const pointerOut = (event: PointerEvent) => {
    if (anchorAt(event.target) !== anchorAt(event.relatedTarget)) cancel("pointer");
  };

  const focusIn = (event: FocusEvent) => {
    if (keyboardFocus) schedule("focus", anchorAt(event.target));
  };
  const focusOut = (event: FocusEvent) => {
    if (anchorAt(event.target) !== anchorAt(event.relatedTarget)) cancel("focus");
  };

  const pointerDown = () => {
    keyboardFocus = false;
    cancel("focus");
  };
  const keyDown = () => {
    keyboardFocus = true;
  };
  const unsubscribe = subscribePreloadSession(cancelAll);

  document.addEventListener("pointerover", pointerOver);
  document.addEventListener("pointerout", pointerOut);
  document.addEventListener("pointerdown", pointerDown);
  document.addEventListener("keydown", keyDown);
  document.addEventListener("focusin", focusIn);
  document.addEventListener("focusout", focusOut);

  return {
    cancel: cancelAll,
    dispose() {
      cancelAll();
      unsubscribe();
      document.removeEventListener("pointerover", pointerOver);
      document.removeEventListener("pointerout", pointerOut);
      document.removeEventListener("pointerdown", pointerDown);
      document.removeEventListener("keydown", keyDown);
      document.removeEventListener("focusin", focusIn);
      document.removeEventListener("focusout", focusOut);
    },
  };
}
