import "@testing-library/jest-dom";
import { act, fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import toast from "react-hot-toast";
import { dismissToast, showErrorToast, showInfoToast, showSuccessToast, ToasterBar } from ".";

describe("Toasts", () => {
  beforeAll(() => {
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: () => ({ matches: false, addListener: () => {}, removeListener: () => {} }),
    });
  });

  beforeEach(() => {
    jest.useFakeTimers();
    render(<ToasterBar />);
  });

  afterEach(async () => {
    await act(async () => toast.remove());
    jest.useRealTimers();
  });

  it.each([showErrorToast, showInfoToast, showSuccessToast])(
    "preserves automatic dismissal by default",
    async (show) => {
      await act(async () => {
        show("Title", "Description");
      });
      expect(screen.getByText("Title")).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "Close notification" })).not.toBeInTheDocument();
      await act(async () => {
        jest.advanceTimersByTime(5000);
      });
      expect(screen.queryByText("Title")).not.toBeInTheDocument();
    },
  );

  it("keeps an infinite toast visible until its corner button closes it", async () => {
    await act(async () => {
      showErrorToast("Title", "Description", { duration: Infinity });
    });
    await act(async () => {
      jest.advanceTimersByTime(60000);
    });
    expect(screen.getByText("Title")).toBeInTheDocument();
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Close notification" }));
    });
    expect(screen.queryByText("Title")).not.toBeInTheDocument();
  });

  it("closes immediately when the action is clicked, even while the action is pending", async () => {
    const action = jest.fn(() => new Promise<void>(() => {}));
    await act(async () => {
      showErrorToast("Title", "Description", { duration: Infinity, action: { label: "Try again", onClick: action } });
    });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    });
    expect(action).toHaveBeenCalledTimes(1);
    expect(screen.queryByText("Title")).not.toBeInTheDocument();
  });

  it("updates an existing toast by ID and supports programmatic dismissal", async () => {
    let id = "";
    await act(async () => {
      id = showInfoToast("Title", "Description", { id: "request-error", duration: Infinity });
    });
    await act(async () => {
      showInfoToast("Updated title", "Description", { id, duration: Infinity });
    });
    expect(screen.queryByText("Title")).not.toBeInTheDocument();
    expect(screen.getAllByText("Updated title")).toHaveLength(1);
    await act(async () => dismissToast(id));
    expect(screen.queryByText("Updated title")).not.toBeInTheDocument();
  });
});
