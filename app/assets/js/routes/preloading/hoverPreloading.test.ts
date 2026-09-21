/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import { listenForPagePreloads } from "./hoverPreloading";
import { disablePreloading } from "./preloadSession";

const preloader = {
  isEligible: jest.fn(() => true),
  scope: jest.fn(() => "acme"),
  preloadPage: jest.fn(async () => {}),
  hasPending: () => false,
  subscribeToCompletion: () => () => {},
  dispose: jest.fn(),
};

let listener: ReturnType<typeof listenForPagePreloads>;

function link() {
  const anchor = document.createElement("a");
  anchor.href = "/acme/project";
  const child = document.createElement("span");
  anchor.append(child);
  document.body.append(anchor);

  return { anchor, child };
}

function pointer(target: Element, type: string, relatedTarget: Element | null = null, pointerType = "mouse") {
  const event = new MouseEvent(type, { bubbles: true, relatedTarget });
  Object.defineProperty(event, "pointerType", { value: pointerType });
  target.dispatchEvent(event);
}

beforeEach(() => {
  jest.useFakeTimers();
  jest.clearAllMocks();
  document.body.innerHTML = "";

  preloader.isEligible.mockReturnValue(true);
  preloader.scope.mockReturnValue("acme");
  listener = listenForPagePreloads(preloader, document);
});

afterEach(() => {
  listener.dispose();
  jest.useRealTimers();
});

it("waits 150 ms and handles dynamic nested links without restarting on child transitions", () => {
  const { anchor, child } = link();

  pointer(anchor, "pointerover");
  jest.advanceTimersByTime(149);

  expect(preloader.preloadPage).not.toHaveBeenCalled();

  pointer(anchor, "pointerout", child);
  pointer(child, "pointerover", anchor);
  jest.advanceTimersByTime(1);

  expect(preloader.preloadPage).toHaveBeenCalledTimes(1);
});

it("cancels on early leave and blur", () => {
  const { anchor } = link();

  pointer(anchor, "pointerover");
  jest.advanceTimersByTime(100);
  pointer(anchor, "pointerout");
  anchor.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
  jest.advanceTimersByTime(100);
  anchor.dispatchEvent(new FocusEvent("focusout", { bubbles: true }));
  jest.advanceTimersByTime(150);

  expect(preloader.preloadPage).not.toHaveBeenCalled();
});

it("preloads keyboard focus but ignores touch and pointer-induced focus", () => {
  const { anchor } = link();

  pointer(anchor, "pointerover", null, "touch");
  pointer(anchor, "pointerdown", null, "touch");
  anchor.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
  jest.advanceTimersByTime(150);

  expect(preloader.preloadPage).not.toHaveBeenCalled();

  document.dispatchEvent(new KeyboardEvent("keydown", { key: "Tab" }));
  anchor.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
  jest.advanceTimersByTime(150);

  expect(preloader.preloadPage).toHaveBeenCalledTimes(1);
});

it.each(["download", "target", "data-preload"])("skips %s links including nested elements", (attribute) => {
  const { anchor, child } = link();

  anchor.setAttribute(attribute, attribute === "target" ? "_blank" : "false");
  pointer(child, "pointerover");
  jest.advanceTimersByTime(150);

  expect(preloader.preloadPage).not.toHaveBeenCalled();
});

it("rechecks eligibility and scope", () => {
  const { anchor } = link();

  pointer(anchor, "pointerover");
  preloader.isEligible.mockReturnValue(false);
  jest.advanceTimersByTime(150);

  expect(preloader.preloadPage).not.toHaveBeenCalled();

  preloader.isEligible.mockReturnValue(true);
  pointer(anchor, "pointerover");
  preloader.scope.mockReturnValue("other");
  jest.advanceTimersByTime(150);

  expect(preloader.preloadPage).not.toHaveBeenCalled();
});

it("cancels for navigation and removes listeners on unmount", () => {
  const { anchor } = link();

  pointer(anchor, "pointerover");
  listener.cancel();
  jest.advanceTimersByTime(150);

  expect(preloader.preloadPage).not.toHaveBeenCalled();

  pointer(anchor, "pointerover");
  listener.dispose();
  pointer(anchor, "pointerover");
  jest.advanceTimersByTime(150);

  expect(preloader.preloadPage).not.toHaveBeenCalled();
});

it("keeps predictive work paused until both pointer and focus timers are gone", () => {
  listener.dispose();
  const onPendingChange = jest.fn();
  listener = listenForPagePreloads(preloader, document, onPendingChange);
  const { anchor } = link();

  pointer(anchor, "pointerover");
  anchor.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
  pointer(anchor, "pointerout");
  expect(onPendingChange).toHaveBeenLastCalledWith(true);

  anchor.dispatchEvent(new FocusEvent("focusout", { bubbles: true }));
  expect(onPendingChange).toHaveBeenLastCalledWith(false);

  pointer(anchor, "pointerover");
  jest.advanceTimersByTime(150);
  expect(preloader.preloadPage).toHaveBeenCalledTimes(1);
  expect(onPendingChange).toHaveBeenLastCalledWith(false);
});

it("cancels pending timers on authentication changes", () => {
  pointer(link().anchor, "pointerover");
  disablePreloading();
  jest.advanceTimersByTime(150);

  expect(preloader.preloadPage).not.toHaveBeenCalled();
});
