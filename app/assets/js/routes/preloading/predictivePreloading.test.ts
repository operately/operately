import { createPredictivePreloading } from "./predictivePreloading";
import { disablePreloading } from "./preloadSession";

function setup() {
  let onCompletion = () => {};
  const preloader = {
    preloadPage: jest.fn(async (_href: string) => {}),
    isEligible: jest.fn(() => true),
    scope: jest.fn(() => "company"),
    hasPending: jest.fn(() => false),
    subscribeToCompletion: (listener: () => void) => {
      onCompletion = listener;
      return jest.fn();
    },
    dispose: jest.fn(),
  };
  const queue = createPredictivePreloading(preloader);
  return { preloader, queue, complete: () => onCompletion() };
}

beforeEach(() => jest.useFakeTimers());
afterEach(() => jest.useRealTimers());

it("starts without a timer and runs unique destinations back-to-back", async () => {
  const { preloader, queue } = setup();
  let finish = () => {};
  preloader.preloadPage.mockImplementationOnce(
    () =>
      new Promise<void>((resolve) => {
        finish = resolve;
      }),
  );
  queue.schedule(["/map", "/space", "/map"]);

  await jest.advanceTimersByTimeAsync(0);
  expect(jest.getTimerCount()).toBe(0);
  expect(preloader.preloadPage.mock.calls).toEqual([["/map"]]);

  finish();
  await jest.advanceTimersByTimeAsync(0);
  expect(preloader.preloadPage.mock.calls).toEqual([["/map"], ["/space"]]);
  queue.dispose();
});

it("discards old queued work while allowing its in-flight loader to finish", async () => {
  const { preloader, queue } = setup();
  let finish = () => {};
  preloader.preloadPage.mockImplementationOnce(
    () =>
      new Promise<void>((resolve) => {
        finish = resolve;
      }),
  );
  const releaseHome = queue.schedule(["/map", "/old-space"]);
  await jest.advanceTimersByTimeAsync(0);

  queue.cancel();
  queue.schedule(["/new-tool"]);
  releaseHome();
  await jest.advanceTimersByTimeAsync(0);
  expect(preloader.preloadPage.mock.calls).toEqual([["/map"]]);

  finish();
  await jest.advanceTimersByTimeAsync(0);
  expect(preloader.preloadPage.mock.calls).toEqual([["/map"], ["/new-tool"]]);
  queue.dispose();
});

it("resumes immediately when hover requests finish, without polling", async () => {
  const { preloader, queue, complete } = setup();
  queue.setHoverPending(true);
  queue.schedule(["/space"]);
  await jest.advanceTimersByTimeAsync(0);
  expect(preloader.preloadPage).not.toHaveBeenCalled();
  expect(jest.getTimerCount()).toBe(0);

  preloader.hasPending.mockReturnValue(true);
  queue.setHoverPending(false);
  await jest.advanceTimersByTimeAsync(0);
  expect(preloader.preloadPage).not.toHaveBeenCalled();
  expect(jest.getTimerCount()).toBe(0);

  preloader.hasPending.mockReturnValue(false);
  complete();
  await jest.advanceTimersByTimeAsync(0);
  expect(preloader.preloadPage).toHaveBeenCalledWith("/space");
  queue.dispose();
});

it("resumes when hover is abandoned before its request starts", async () => {
  const { preloader, queue } = setup();
  queue.setHoverPending(true);
  queue.schedule(["/space"]);
  await jest.advanceTimersByTimeAsync(0);
  expect(preloader.preloadPage).not.toHaveBeenCalled();

  queue.setHoverPending(false);
  await jest.advanceTimersByTimeAsync(0);
  expect(preloader.preloadPage).toHaveBeenCalledWith("/space");
  queue.dispose();
});

it("checks exclusions at execution and discards work after scope changes", async () => {
  const { preloader, queue } = setup();
  queue.schedule(["/excluded", "/allowed"]);
  preloader.isEligible.mockImplementation((..._args) => false);
  await jest.advanceTimersByTimeAsync(0);
  expect(preloader.preloadPage).not.toHaveBeenCalled();

  preloader.isEligible.mockReturnValue(true);
  queue.schedule(["/other"]);
  preloader.scope.mockReturnValue("other-company");
  await jest.advanceTimersByTimeAsync(0);
  expect(preloader.preloadPage).not.toHaveBeenCalled();
  queue.dispose();
});

it("drops queued work on page cleanup, disposal, and authentication changes", async () => {
  const { preloader, queue } = setup();
  const release = queue.schedule(["/space"]);
  release();
  await jest.advanceTimersByTimeAsync(0);
  expect(preloader.preloadPage).not.toHaveBeenCalled();

  queue.schedule(["/space"]);
  queue.dispose();
  await jest.advanceTimersByTimeAsync(0);
  expect(preloader.preloadPage).not.toHaveBeenCalled();

  const next = setup();
  next.queue.schedule(["/space"]);
  disablePreloading();
  await jest.advanceTimersByTimeAsync(0);
  next.queue.schedule(["/space"]);
  await jest.advanceTimersByTimeAsync(0);
  expect(next.preloader.preloadPage).not.toHaveBeenCalled();
  next.queue.dispose();
});
