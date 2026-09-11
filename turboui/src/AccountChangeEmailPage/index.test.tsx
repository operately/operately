import React from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MemoryRouter } from "react-router";
import { AccountChangeEmailPage } from "./index";
import type { EmailChangeState } from "../ApiTypes";
import { showSuccessToast } from "../Toasts";

jest.mock("../Toasts", () => ({ showSuccessToast: jest.fn() }));

beforeEach(() => jest.clearAllMocks());

const state: EmailChangeState = {
  __typename: "email_change_state",
  currentEmail: "old@example.com",
  pending: null,
  retryAfter: 0,
};
const pending: EmailChangeState = {
  ...state,
  pending: {
    __typename: "email_change_request",
    id: "request",
    email: "new@example.com",
    expiresAt: "2099-01-01T00:00:00Z",
    attemptsRemaining: 5,
  },
};

function setup(overrides: Partial<AccountChangeEmailPage.Props> = {}) {
  const props: AccountChangeEmailPage.Props = {
    state,
    homePath: "/",
    securityPath: "/security",
    error: null,
    busy: false,
    completedEmail: null,
    allowEmailLogin: true,
    allowGoogleLogin: true,
    onRequest: jest.fn().mockResolvedValue(true),
    onConfirm: jest.fn().mockResolvedValue(true),
    onCancelRequest: jest.fn().mockResolvedValue(true),
    onExit: jest.fn(),
    ...overrides,
  };
  const view = render(
    <MemoryRouter>
      <AccountChangeEmailPage {...props} />
    </MemoryRouter>,
  );
  return { ...view, props };
}

test("submits a trimmed email through the keyboard form path", async () => {
  const { props } = setup();
  const input = screen.getByLabelText("New email");
  expect(input).toHaveFocus();
  fireEvent.change(input, { target: { value: " new@example.com " } });
  const form = input.closest("form");
  if (!form) throw new Error("Missing form");
  fireEvent.submit(form);
  await waitFor(() => expect(props.onRequest).toHaveBeenCalledWith("new@example.com"));
});

test("accepts pasted lowercase formatted codes", async () => {
  const { props } = setup({ state: pending });
  const input = screen.getByLabelText("Verification code");
  expect(input).toHaveAttribute("autocomplete", "one-time-code");
  fireEvent.change(input, { target: { value: " abc-123 " } });
  const form = input.closest("form");
  if (!form) throw new Error("Missing form");
  fireEvent.submit(form);
  await waitFor(() => expect(props.onConfirm).toHaveBeenCalledWith("request", " abc-123 "));
});

test("keeps the entry form and draft visible after delivery failure", () => {
  const { props, rerender } = setup();
  fireEvent.change(screen.getByLabelText("New email"), { target: { value: "new@example.com" } });
  rerender(
    <MemoryRouter>
      <AccountChangeEmailPage {...props} error="Delivery failed" />
    </MemoryRouter>,
  );
  expect(screen.getByLabelText("New email")).toHaveValue("new@example.com");
  expect(screen.getByRole("alert")).toBeInTheDocument();
  expect(screen.queryByLabelText("Verification code")).not.toBeInTheDocument();
});

test("resend becomes available after the server-provided cooldown", () => {
  jest.useFakeTimers();
  setup({ state: { ...pending, retryAfter: 60 } });
  expect(screen.getByRole("button", { name: "Resend code" })).toBeDisabled();
  act(() => jest.advanceTimersByTime(60000));
  expect(screen.getByRole("button", { name: "Resend code" })).toBeEnabled();
  jest.useRealTimers();
});

test("expired codes cannot be submitted but can be replaced", () => {
  const request = pending.pending;
  if (!request) throw new Error("Missing fixture request");
  setup({ state: { ...pending, pending: { ...request, expiresAt: new Date(0).toISOString() } } });
  expect(screen.getByRole("button", { name: "Confirm email change" })).toBeDisabled();
  expect(screen.getByRole("button", { name: "Resend code" })).toBeEnabled();
});

test("changing destination cancels the request without exiting", async () => {
  const { props } = setup({ state: pending });
  fireEvent.click(screen.getByRole("button", { name: "Use a different email" }));
  await waitFor(() => expect(props.onCancelRequest).toHaveBeenCalledWith("request"));
  expect(props.onExit).not.toHaveBeenCalled();
});

test("cancel waits for invalidation before exiting", async () => {
  const { props } = setup({ state: pending });
  fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
  await waitFor(() => expect(props.onExit).toHaveBeenCalledTimes(1));
  expect(props.onCancelRequest).toHaveBeenCalledWith("request");
});

test("busy state prevents repeated actions", () => {
  setup({ state: pending, busy: true });
  expect(screen.getByRole("button", { name: "Resend code" })).toBeDisabled();
  expect(screen.getByRole("button", { name: "Confirm email change" })).toBeDisabled();
  expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();
});

test("success focuses the confirmation heading", () => {
  setup({ completedEmail: "new@example.com" });
  expect(screen.getByRole("heading", { name: "Email changed" })).toHaveFocus();
  expect(screen.getByRole("link", { name: "Back to Password & Security" })).toBeInTheDocument();
});

test("resend shows progress and preserves success feedback when the request is replaced", async () => {
  let finishRequest: (success: boolean) => void = () => {};
  const response = new Promise<boolean>((resolve) => {
    finishRequest = resolve;
  });
  const onRequest = jest.fn(() => response);
  const { props, rerender } = setup({ state: pending, onRequest });
  fireEvent.change(screen.getByLabelText("Verification code"), { target: { value: "ABC123" } });
  fireEvent.click(screen.getByRole("button", { name: "Resend code" }));

  expect(screen.getByRole("button", { name: "Sending code…" })).toBeDisabled();
  expect(screen.getByRole("status")).toHaveTextContent("Sending code…");
  expect(screen.getByRole("button", { name: "Use a different email" })).toBeDisabled();
  expect(showSuccessToast).not.toHaveBeenCalled();
  expect(onRequest).toHaveBeenCalledWith("new@example.com");

  const request = pending.pending;
  if (!request) throw new Error("Missing fixture request");
  rerender(
    <MemoryRouter>
      <AccountChangeEmailPage
        {...props}
        state={{ ...pending, pending: { ...request, id: "replacement" }, retryAfter: 60 }}
      />
    </MemoryRouter>,
  );
  await act(async () => {
    finishRequest(true);
  });

  expect(screen.getByRole("status")).toBeEmptyDOMElement();
  expect(screen.getByLabelText("Verification code")).toHaveValue("");
  expect(screen.getByLabelText("Verification code")).toHaveFocus();
  expect(screen.getByRole("button", { name: "Resend code" })).toBeDisabled();
  expect(showSuccessToast).toHaveBeenCalledTimes(1);
  expect(showSuccessToast).toHaveBeenCalledWith("Code sent", "New code sent to new@example.com.");
});

test("a failed resend preserves the entered code and does not show success feedback", async () => {
  const { props, rerender } = setup({ state: pending, onRequest: jest.fn().mockResolvedValue(false) });
  fireEvent.change(screen.getByLabelText("Verification code"), { target: { value: "ABC123" } });
  fireEvent.click(screen.getByRole("button", { name: "Resend code" }));
  await waitFor(() => expect(screen.getByRole("button", { name: "Resend code" })).toBeEnabled());
  rerender(
    <MemoryRouter>
      <AccountChangeEmailPage {...props} error="We couldn’t send the code. Please try again." />
    </MemoryRouter>,
  );

  expect(screen.getByRole("alert")).toBeInTheDocument();
  expect(screen.getByLabelText("Verification code")).toHaveValue("ABC123");
  expect(screen.getByRole("status")).toBeEmptyDOMElement();
  expect(showSuccessToast).not.toHaveBeenCalled();
});

test("returning to verification does not repeat the resend toast", async () => {
  const { props, rerender } = setup({ state: pending });
  fireEvent.click(screen.getByRole("button", { name: "Resend code" }));
  await waitFor(() => expect(showSuccessToast).toHaveBeenCalledTimes(1));

  rerender(
    <MemoryRouter>
      <AccountChangeEmailPage {...props} state={state} />
    </MemoryRouter>,
  );
  rerender(
    <MemoryRouter>
      <AccountChangeEmailPage {...props} state={pending} />
    </MemoryRouter>,
  );
  expect(screen.getByRole("status")).toBeEmptyDOMElement();
  expect(showSuccessToast).toHaveBeenCalledTimes(1);
});
