import React from "react";
import { act, configure, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import "@testing-library/jest-dom";
import { MemoryRouter } from "react-router";
import { AccountChangeEmailPage } from "./index";
import type { EmailChangeState } from "../ApiTypes";
import { showSuccessToast } from "../Toasts";

jest.mock("../Toasts", () => ({ showSuccessToast: jest.fn() }));

configure({ testIdAttribute: "data-test-id" });

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
    stage: "new_email",
    codeRecipient: "new@example.com",
    authorizationExpiresAt: "2099-01-01T00:00:00Z",
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
    onVerifyCurrent: jest.fn().mockResolvedValue(true),
    onResend: jest.fn().mockResolvedValue(true),
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
  const input = screen.getByTestId("new-email");
  expect(input).toHaveFocus();
  expect(input).toHaveAccessibleName();
  fireEvent.change(input, { target: { value: " new@example.com " } });
  const form = input.closest("form");
  if (!form) throw new Error("Missing form");
  fireEvent.submit(form);
  await waitFor(() => expect(props.onRequest).toHaveBeenCalledWith("new@example.com"));
});

test("accepts pasted lowercase formatted codes", async () => {
  const { props } = setup({ state: pending });
  const input = screen.getByTestId("verification-code");
  expect(input).toHaveAccessibleName();
  expect(input).toHaveAttribute("autocomplete", "one-time-code");
  fireEvent.change(input, { target: { value: " abc-123 " } });
  const form = input.closest("form");
  if (!form) throw new Error("Missing form");
  fireEvent.submit(form);
  await waitFor(() => expect(props.onConfirm).toHaveBeenCalledWith("request", " abc-123 "));
});

test("keeps the entry form and draft visible after delivery failure", () => {
  const { props, rerender } = setup();
  fireEvent.change(screen.getByTestId("new-email"), { target: { value: "new@example.com" } });
  rerender(
    <MemoryRouter>
      <AccountChangeEmailPage {...props} error="Delivery failed" />
    </MemoryRouter>,
  );
  expect(screen.getByTestId("new-email")).toHaveValue("new@example.com");
  expect(screen.getByRole("alert")).toBeInTheDocument();
  expect(screen.queryByTestId("verification-code")).not.toBeInTheDocument();
});

test("resend becomes available after the server-provided cooldown", () => {
  jest.useFakeTimers();
  setup({ state: { ...pending, retryAfter: 60 } });
  expect(screen.getByTestId("resend-email-code")).toBeDisabled();
  act(() => jest.advanceTimersByTime(60000));
  expect(screen.getByTestId("resend-email-code")).toBeEnabled();
  jest.useRealTimers();
});

test("expired codes cannot be submitted but can be replaced", () => {
  const request = pending.pending;
  if (!request) throw new Error("Missing fixture request");
  setup({ state: { ...pending, pending: { ...request, expiresAt: new Date(0).toISOString() } } });
  expect(screen.getByTestId("submit-email-change")).toBeDisabled();
  expect(screen.getByTestId("resend-email-code")).toBeEnabled();
});

test("changing destination cancels the request without exiting", async () => {
  const { props } = setup({ state: pending });
  fireEvent.click(screen.getByTestId("change-email-destination"));
  await waitFor(() => expect(props.onCancelRequest).toHaveBeenCalledWith("request"));
  expect(props.onExit).not.toHaveBeenCalled();
});

test("cancel waits for invalidation before exiting", async () => {
  const { props } = setup({ state: pending });
  fireEvent.click(screen.getByTestId("cancel-email-change"));
  await waitFor(() => expect(props.onExit).toHaveBeenCalledTimes(1));
  expect(props.onCancelRequest).toHaveBeenCalledWith("request");
});

test("busy state prevents repeated actions", () => {
  setup({ state: pending, busy: true });
  expect(screen.getByTestId("resend-email-code")).toBeDisabled();
  expect(screen.getByTestId("submit-email-change")).toBeDisabled();
  expect(screen.getByTestId("cancel-email-change")).toBeDisabled();
});

test("success focuses the confirmation heading", () => {
  setup({ completedEmail: "new@example.com" });
  expect(within(screen.getByTestId("email-change-success")).getByRole("heading", { level: 1 })).toHaveFocus();
  expect(screen.getByTestId("email-change-done")).toHaveAttribute("href", "/security");
});

test("resend shows progress and preserves success feedback when the request is replaced", async () => {
  let finishRequest: (success: boolean) => void = () => {};
  const response = new Promise<boolean>((resolve) => {
    finishRequest = resolve;
  });
  const onResend = jest.fn(() => response);
  const { props, rerender } = setup({ state: pending, onResend });
  fireEvent.change(screen.getByTestId("verification-code"), { target: { value: "ABC123" } });
  fireEvent.click(screen.getByTestId("resend-email-code"));

  expect(screen.getByTestId("resend-email-code")).toBeDisabled();
  expect(screen.getByRole("status")).not.toBeEmptyDOMElement();
  expect(within(screen.getByTestId("email-change-verification")).getByRole("group")).toHaveAttribute(
    "aria-busy",
    "true",
  );
  expect(screen.getByTestId("change-email-destination")).toBeDisabled();
  expect(showSuccessToast).not.toHaveBeenCalled();
  expect(onResend).toHaveBeenCalledWith("request");

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
  expect(screen.getByTestId("verification-code")).toHaveValue("");
  expect(screen.getByTestId("verification-code")).toHaveFocus();
  expect(screen.getByTestId("resend-email-code")).toBeDisabled();
  expect(showSuccessToast).toHaveBeenCalledTimes(1);
  expect(showSuccessToast).toHaveBeenCalledWith(expect.any(String), expect.stringContaining("new@example.com"));
});

test("a failed resend preserves the entered code and does not show success feedback", async () => {
  const { props, rerender } = setup({ state: pending, onResend: jest.fn().mockResolvedValue(false) });
  fireEvent.change(screen.getByTestId("verification-code"), { target: { value: "ABC123" } });
  fireEvent.click(screen.getByTestId("resend-email-code"));
  await waitFor(() => expect(screen.getByTestId("resend-email-code")).toBeEnabled());
  rerender(
    <MemoryRouter>
      <AccountChangeEmailPage {...props} error="We couldn’t send the code. Please try again." />
    </MemoryRouter>,
  );

  expect(screen.getByRole("alert")).toBeInTheDocument();
  expect(screen.getByTestId("verification-code")).toHaveValue("ABC123");
  expect(screen.getByRole("status")).toBeEmptyDOMElement();
  expect(showSuccessToast).not.toHaveBeenCalled();
});

test("returning to verification does not repeat the resend toast", async () => {
  const { props, rerender } = setup({ state: pending });
  fireEvent.click(screen.getByTestId("resend-email-code"));
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

function currentInboxState(): EmailChangeState {
  if (!pending.pending) throw new Error("Missing fixture request");
  return {
    ...pending,
    pending: {
      ...pending.pending,
      stage: "current_email",
      codeRecipient: state.currentEmail,
      authorizationExpiresAt: null,
    },
  };
}

test("current-inbox verification uses its dedicated callback and recipient", async () => {
  const { props } = setup({ state: currentInboxState() });
  expect(screen.getByTestId("email-change-current-inbox")).toBeInTheDocument();
  expect(screen.getByText(state.currentEmail)).toBeInTheDocument();
  fireEvent.change(screen.getByTestId("verification-code"), { target: { value: "abc-123" } });
  fireEvent.click(screen.getByTestId("submit-email-change"));
  await waitFor(() => expect(props.onVerifyCurrent).toHaveBeenCalledWith("request", "abc-123"));
  expect(props.onConfirm).not.toHaveBeenCalled();
});

test("resending a current-inbox code names the current recipient in the toast", async () => {
  setup({ state: currentInboxState() });
  fireEvent.click(screen.getByTestId("resend-email-code"));
  await waitFor(() =>
    expect(showSuccessToast).toHaveBeenCalledWith(expect.any(String), expect.stringContaining(state.currentEmail)),
  );
});

test("expired current-inbox authorization blocks confirmation and resend and offers restart", async () => {
  if (!pending.pending) throw new Error("Missing fixture request");
  const { props } = setup({
    state: { ...pending, pending: { ...pending.pending, authorizationExpiresAt: new Date(0).toISOString() } },
  });
  expect(screen.getByTestId("submit-email-change")).toBeDisabled();
  expect(screen.getByTestId("resend-email-code")).toBeDisabled();
  fireEvent.click(screen.getByTestId("restart-email-change"));
  await waitFor(() => expect(props.onCancelRequest).toHaveBeenCalledWith("request"));
  expect(props.onExit).not.toHaveBeenCalled();
});

test("a failed current-inbox verification keeps the code and recipient visible", async () => {
  const { props, rerender } = setup({
    state: currentInboxState(),
    onVerifyCurrent: jest.fn().mockResolvedValue(false),
  });
  fireEvent.change(screen.getByTestId("verification-code"), { target: { value: "ABC123" } });
  fireEvent.click(screen.getByTestId("submit-email-change"));
  await waitFor(() => expect(props.onVerifyCurrent).toHaveBeenCalled());
  rerender(
    <MemoryRouter>
      <AccountChangeEmailPage {...props} error="Delivery failed" />
    </MemoryRouter>,
  );
  expect(screen.getByTestId("verification-code")).toHaveValue("ABC123");
  expect(screen.getByText(state.currentEmail)).toBeInTheDocument();
  expect(screen.getByRole("alert")).toBeInTheDocument();
  expect(props.onConfirm).not.toHaveBeenCalled();
});

test("returning to entry focuses the email after cancellation finishes", () => {
  const { props, rerender } = setup({ state: pending, busy: true });
  rerender(
    <MemoryRouter>
      <AccountChangeEmailPage {...props} state={state} />
    </MemoryRouter>,
  );
  rerender(
    <MemoryRouter>
      <AccountChangeEmailPage {...props} state={state} busy={false} />
    </MemoryRouter>,
  );
  expect(screen.getByTestId("new-email")).toHaveFocus();
});
