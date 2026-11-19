/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import React, { act } from "react";
import { createRoot } from "react-dom/client";
import { useSubscription } from "./socket";

const mockChannels: any[] = [];
jest.mock("phoenix", () => ({
  Socket: jest.fn().mockImplementation(() => ({
    connect: jest.fn(),
    channel: jest.fn((name, payload) => {
      const callbacks: Record<string, () => void> = {};
      const channel = {
        name,
        payload,
        callbacks,
        on: jest.fn((_event, callback) => {
          channel.event = callback;
          return 1;
        }),
        event: () => {},
        off: jest.fn(),
        leave: jest.fn(),
        join: () => ({
          receive: function (status: string, callback: () => void) {
            callbacks[status] = callback;
            return this;
          },
        }),
      };
      mockChannels.push(channel);
      return channel;
    }),
  })),
}));
jest.mock("../features/SupportSessions", () => ({ getSupportSessionCookie: () => null }));

it("keeps the subscription across callback changes, refreshes on join/rejoin, and cleans up", async () => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  window.appConfig = { api: { socketToken: "test" } } as typeof window.appConfig;
  const root = createRoot(document.createElement("div"));
  const first = jest.fn();
  const second = jest.fn();
  const joined = jest.fn();
  const payload = { projectId: "one" };
  function Subscriber({ callback }: { callback: () => void }) {
    useSubscription("api:project_updated", callback, payload, joined);
    return null;
  }
  await act(async () => root.render(<Subscriber callback={first} />));
  const channel = mockChannels[0];
  channel.callbacks.ok();
  channel.event();
  expect(first).toHaveBeenCalledTimes(1);
  await act(async () => root.render(<Subscriber callback={second} />));
  expect(mockChannels).toHaveLength(1);
  channel.event();
  channel.callbacks.ok();
  expect(second).toHaveBeenCalledTimes(1);
  expect(joined).toHaveBeenCalledTimes(2);
  await act(async () => root.unmount());
  expect(channel.off).toHaveBeenCalledWith("event", 1);
  expect(channel.leave).toHaveBeenCalledTimes(1);
});
