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
  });

  async function intersect(visible = true) {
    const observer = observers[observers.length - 1];
    if (!observer) throw new Error("Expected an observer");
    await act(async () => {
      observer.callback([{ isIntersecting: visible } as IntersectionObserverEntry], {} as IntersectionObserver);
    });
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
    rerender(
      <InfiniteScroll observationKey="page-1" hasNextPage isFetching={false} onLoadMore={load}>
        {content}
      </InfiniteScroll>,
    );
    await intersect();
    expect(load).toHaveBeenCalledTimes(1);
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
