import React from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";

import { CopyToClipboard } from ".";
import { showErrorToast } from "../Toasts";

jest.mock("../Toasts", () => ({ showErrorToast: jest.fn() }));

const writeText = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  writeText.mockResolvedValue(undefined);
  Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText } });
});

it("restores the labeled action after confirming a successful copy", async () => {
  jest.useFakeTimers();
  try {
    render(<CopyToClipboard text="Invitation message" label="Copy message" size={25} />);
    fireEvent.click(screen.getByRole("button", { name: "Copy message" }));

    await waitFor(() => expect(screen.getByRole("button", { name: "Copied" })).toBeInTheDocument());
    expect(writeText).toHaveBeenCalledWith("Invitation message");

    act(() => jest.advanceTimersByTime(2000));
    expect(screen.getByRole("button", { name: "Copy message" })).toBeInTheDocument();
  } finally {
    jest.useRealTimers();
  }
});

it("reports a clipboard failure without claiming the message was copied", async () => {
  writeText.mockRejectedValueOnce(new Error("Clipboard denied"));
  render(<CopyToClipboard text="Invitation message" label="Copy message" size={25} />);

  fireEvent.click(screen.getByRole("button", { name: "Copy message" }));

  await waitFor(() => expect(showErrorToast).toHaveBeenCalled());
  expect(screen.getByRole("button", { name: "Copy message" })).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: "Copied" })).not.toBeInTheDocument();
});
