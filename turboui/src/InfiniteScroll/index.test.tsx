import React from "react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { InfiniteScroll } from ".";

describe("InfiniteScroll", () => {
  let observers: { callback: IntersectionObserverCallback; observe: jest.Mock; disconnect: jest.Mock }[];
  const originalObserver = globalThis.IntersectionObserver;

  beforeEach(() => {
    observers = [];
    globalThis.IntersectionObserver = jest.fn((callback) => {
      const observer = { callback, observe: jest.fn(), disconnect: jest.fn() };
      observers.push(observer);
      return observer;
    }) as unknown as typeof IntersectionObserver;
  });

  afterEach(() => {
    globalThis.IntersectionObserver = originalObserver;
    jest.restoreAllMocks();
  });

  async function intersect(visible = true) {
    const observer = observers[observers.length - 1];
    if (!observer) throw new Error("Expected an observer");
    await act(async () => {
      observer.callback([{ isIntersecting: visible } as IntersectionObserverEntry], {} as IntersectionObserver);
    });
  }

  function boundsAt(top: number): DOMRect {
    return { x: 0, y: top, top, bottom: top + 40, left: 0, right: 100, width: 100, height: 40, toJSON: () => ({}) };
  }

  function content(ref: React.RefCallback<HTMLDivElement>) {
    return (
      <div ref={ref} data-testid="activity">
        Activity
      </div>
    );
  }

  it("loads once on visibility and advances even when pages share an aggregated row", async () => {
    const load = jest.fn().mockResolvedValue(undefined);
    const { rerender, unmount } = render(
      <InfiniteScroll observationKey="page-1" hasNextPage isFetching={false} onLoadMore={load}>
        {content}
      </InfiniteScroll>,
    );
    expect(load).not.toHaveBeenCalled();
    await intersect();
    await intersect();
    expect(load).toHaveBeenCalledTimes(1);
    const row = screen.getByTestId("activity");
    rerender(
      <InfiniteScroll observationKey="page-2" hasNextPage isFetching={false} onLoadMore={load}>
        {content}
      </InfiniteScroll>,
    );
    expect(screen.getByTestId("activity")).toBe(row);
    await intersect(false);
    expect(load).toHaveBeenCalledTimes(1);
    await intersect();
    expect(load).toHaveBeenCalledTimes(2);
    rerender(
      <InfiniteScroll observationKey="page-3" hasNextPage={false} isFetching={false} onLoadMore={load}>
        {content}
      </InfiniteScroll>,
    );
    expect(load).toHaveBeenCalledTimes(2);
    unmount();
    expect(observers.every((observer) => observer.disconnect.mock.calls.length > 0)).toBe(true);
  });

  it("waits for an ongoing background fetch to finish", async () => {
    const load = jest.fn().mockResolvedValue(undefined);
    const { rerender } = render(
      <InfiniteScroll observationKey="page-1" hasNextPage isFetching onLoadMore={load}>
        {content}
      </InfiniteScroll>,
    );
    await intersect();
    expect(load).not.toHaveBeenCalled();
    await intersect(false);
    rerender(
      <InfiniteScroll observationKey="page-1" hasNextPage isFetching={false} onLoadMore={load}>
        {content}
      </InfiniteScroll>,
    );
    await act(async () => {});
    expect(load).toHaveBeenCalledTimes(1);
  });

  it("remembers an intersection anywhere in a batch of observer entries", async () => {
    const load = jest.fn().mockResolvedValue(undefined);
    render(
      <InfiniteScroll observationKey="page-1" hasNextPage isFetching={false} onLoadMore={load}>
        {content}
      </InfiniteScroll>,
    );
    const observer = observers[0];
    if (!observer) throw new Error("Expected an observer");
    await act(async () => {
      observer.callback(
        [false, true, false].map((isIntersecting) => ({ isIntersecting }) as IntersectionObserverEntry),
        {} as IntersectionObserver,
      );
    });
    expect(load).toHaveBeenCalledTimes(1);
  });

  it("queues a reached page until the previous load settles without starting duplicate requests", async () => {
    let finish: (() => void) | undefined;
    const load = jest
      .fn()
      .mockImplementationOnce(
        () =>
          new Promise<void>((resolve) => {
            finish = resolve;
          }),
      )
      .mockResolvedValue(undefined);
    const { rerender } = render(
      <InfiniteScroll observationKey="page-1" hasNextPage isFetching={false} onLoadMore={load}>
        {content}
      </InfiniteScroll>,
    );
    await intersect();
    await intersect();
    expect(load).toHaveBeenCalledTimes(1);

    rerender(
      <InfiniteScroll observationKey="page-2" hasNextPage isFetching={false} onLoadMore={load}>
        {content}
      </InfiniteScroll>,
    );
    await intersect();
    await intersect(false);
    expect(load).toHaveBeenCalledTimes(1);

    await act(async () => {
      if (!finish) throw new Error("Expected a pending load");
      finish();
    });
    expect(load).toHaveBeenCalledTimes(2);
  });

  it("checks for a passed target when a background fetch changes the layout", async () => {
    const load = jest.fn().mockResolvedValue(undefined);
    const { rerender } = render(
      <InfiniteScroll observationKey="page-1" hasNextPage isFetching onLoadMore={load}>
        {content}
      </InfiniteScroll>,
    );
    const row = screen.getByTestId("activity");
    jest.spyOn(row, "getBoundingClientRect").mockReturnValue(boundsAt(-100));
    rerender(
      <InfiniteScroll observationKey="page-1" hasNextPage isFetching={false} onLoadMore={load}>
        {content}
      </InfiniteScroll>,
    );
    await act(async () => {});
    expect(load).toHaveBeenCalledTimes(1);
  });

  it("loads when a new page's target is already above the viewport", async () => {
    const load = jest.fn().mockResolvedValue(undefined);
    const { rerender } = render(
      <InfiniteScroll observationKey="page-1" hasNextPage isFetching={false} onLoadMore={load}>
        {content}
      </InfiniteScroll>,
    );
    await intersect();
    const row = screen.getByTestId("activity");
    jest.spyOn(row, "getBoundingClientRect").mockReturnValue(boundsAt(-100));
    rerender(
      <InfiniteScroll observationKey="page-2" hasNextPage isFetching={false} onLoadMore={load}>
        {content}
      </InfiniteScroll>,
    );
    await act(async () => {});
    expect(load).toHaveBeenCalledTimes(2);
  });

  it("detects a target skipped by scrolling and cleans up scheduled position checks", async () => {
    const load = jest.fn().mockResolvedValue(undefined);
    let frame: FrameRequestCallback | undefined;
    const requestFrame = jest.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => {
      frame = callback;
      return 1;
    });
    const cancelFrame = jest.spyOn(window, "cancelAnimationFrame").mockImplementation(() => {});
    const { unmount } = render(
      <InfiniteScroll observationKey="page-1" hasNextPage isFetching={false} onLoadMore={load}>
        {content}
      </InfiniteScroll>,
    );
    const row = screen.getByTestId("activity");
    const bounds = jest.spyOn(row, "getBoundingClientRect");
    bounds.mockReturnValue(boundsAt(window.innerHeight + 100));
    await intersect(false);
    expect(load).not.toHaveBeenCalled();

    bounds.mockReturnValue(boundsAt(-100));
    // No intersection callback: the target jumped from below to above the viewport.
    fireEvent.scroll(window);
    fireEvent.scroll(window);
    expect(requestFrame).toHaveBeenCalledTimes(1);
    await act(async () => {
      if (!frame) throw new Error("Expected a scheduled position check");
      frame(0);
    });
    expect(load).toHaveBeenCalledTimes(1);

    fireEvent.scroll(window);
    unmount();
    expect(cancelFrame).toHaveBeenCalledWith(1);
    requestFrame.mockClear();
    fireEvent.scroll(window);
    expect(requestFrame).not.toHaveBeenCalled();
    expect(observers.every((observer) => observer.disconnect.mock.calls.length > 0)).toBe(true);
  });

  it("stops automatic requests after failure and allows a manual retry", async () => {
    const load = jest.fn().mockRejectedValueOnce(new Error("offline")).mockResolvedValue(undefined);
    render(
      <InfiniteScroll observationKey="page-1" hasNextPage isFetching={false} onLoadMore={load}>
        {content}
      </InfiniteScroll>,
    );
    await intersect();
    expect(screen.getByTestId("activity")).toBeTruthy();
    await intersect();
    expect(load).toHaveBeenCalledTimes(1);
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    });
    expect(load).toHaveBeenCalledTimes(2);
  });

  it("offers manual loading when observers are unavailable", async () => {
    Object.defineProperty(globalThis, "IntersectionObserver", { value: undefined, writable: true, configurable: true });
    const load = jest.fn().mockResolvedValue(undefined);
    render(
      <InfiniteScroll observationKey="page-1" hasNextPage isFetching={false} onLoadMore={load}>
        {content}
      </InfiniteScroll>,
    );
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Load more" }));
    });
    expect(load).toHaveBeenCalledTimes(1);
  });
});
