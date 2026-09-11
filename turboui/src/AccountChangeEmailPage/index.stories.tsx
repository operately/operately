import React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";
import { AccountChangeEmailPage } from "./index";
import type { EmailChangeState } from "../ApiTypes";

const state: EmailChangeState = {
  __typename: "email_change_state",
  currentEmail: "alex@example.com",
  pending: null,
  retryAfter: 0,
};
const request: NonNullable<EmailChangeState["pending"]> = {
  __typename: "email_change_request",
  id: "request-1",
  email: "alex@newcompany.com",
  expiresAt: new Date(Date.now() + 300000).toISOString(),
  attemptsRemaining: 5,
};
const pending: EmailChangeState = { ...state, pending: request };

const meta = {
  title: "Pages/AccountChangeEmailPage",
  tags: ["account-email-change"],
  component: AccountChangeEmailPage,
  parameters: { layout: "fullscreen" },
  args: {
    state,
    homePath: "#",
    securityPath: "#",
    error: null,
    busy: false,
    completedEmail: null,
    allowEmailLogin: true,
    allowGoogleLogin: true,
    onRequest: async () => true,
    onConfirm: async () => true,
    onCancelRequest: async () => true,
    onExit: () => {},
  },
} satisfies Meta<typeof AccountChangeEmailPage>;
export default meta;
type Story = StoryObj<typeof meta>;

export const EnterEmail: Story = {};
export const VerifyCode: Story = { args: { state: pending } };
export const ResendCooldown: Story = { args: { state: { ...pending, retryAfter: 60 } } };
export const Sending: Story = { args: { busy: true } };
export const Verifying: Story = { args: { state: pending, busy: true } };
export const InvalidCode: Story = {
  args: { state: pending, error: "That code doesn’t match. Check your latest email and try again." },
};
export const DeliveryFailure: Story = { args: { error: "We couldn’t send the code. Please try again." } };
export const Expired: Story = {
  args: { state: { ...pending, pending: { ...request, expiresAt: new Date(0).toISOString() } } },
};
export const AttemptsExhausted: Story = {
  args: { state: { ...pending, pending: { ...request, attemptsRemaining: 0 } } },
};
export const Success: Story = { args: { completedEmail: "alex@newcompany.com" } };
export const Mobile: Story = {
  args: { state: pending },
  globals: { viewport: { value: "mobile1", isRotated: false } },
};

function ResendDemo(props: AccountChangeEmailPage.Props) {
  const [currentState, setState] = React.useState(pending);
  const [error, setError] = React.useState<string | null>(null);

  return (
    <AccountChangeEmailPage
      {...props}
      state={currentState}
      error={error}
      onRequest={async (email) => {
        setError(null);
        await new Promise((resolve) => setTimeout(resolve, 500));
        const success = await props.onRequest(email);
        if (success) {
          setState({
            ...state,
            pending: { ...request, id: "resent-request", expiresAt: new Date(Date.now() + 300000).toISOString() },
            retryAfter: 60,
          });
        } else {
          setError("We couldn’t send the code. Please try again.");
        }
        return success;
      }}
    />
  );
}

export const ResendFeedback: Story = {
  render: (args) => <ResendDemo {...args} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole("button", { name: "Resend code" }));
    await expect(canvas.getByRole("button", { name: "Sending code…" })).toBeDisabled();
    await expect(await within(document.body).findByText("Code sent")).toBeVisible();
    await expect(canvas.getByLabelText("Verification code")).toHaveFocus();
  },
};

export const ResendFailure: Story = {
  args: { onRequest: async () => false },
  render: (args) => <ResendDemo {...args} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByLabelText("Verification code"), "abc-123");
    await userEvent.click(canvas.getByRole("button", { name: "Resend code" }));
    await expect(await canvas.findByRole("alert")).toBeVisible();
    await expect(canvas.getByLabelText("Verification code")).toHaveValue("abc-123");
    await expect(canvas.getByRole("button", { name: "Resend code" })).toBeEnabled();
  },
};

function InteractivePage(props: AccountChangeEmailPage.Props) {
  const [currentState, setState] = React.useState(state);
  const [completedEmail, setCompletedEmail] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  return (
    <AccountChangeEmailPage
      {...props}
      state={currentState}
      completedEmail={completedEmail}
      error={error}
      onRequest={async (email) => {
        setError(null);
        setState({
          ...state,
          pending: {
            __typename: "email_change_request",
            id: "demo",
            email,
            expiresAt: new Date(Date.now() + 300000).toISOString(),
            attemptsRemaining: 5,
          },
        });
        return true;
      }}
      onConfirm={async (_id, code) => {
        if (code.replace(/[\s-]/g, "").toUpperCase() !== "ABC123") {
          setError("That code doesn’t match. Try ABC-123 in this demo.");
          return false;
        }
        setCompletedEmail(currentState.pending?.email ?? null);
        return true;
      }}
      onCancelRequest={async () => {
        setState(state);
        setError(null);
        return true;
      }}
    />
  );
}

export const CompleteFlow: Story = {
  render: (args) => <InteractivePage {...args} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await userEvent.type(canvas.getByLabelText("New email"), "alex@newcompany.com");
    await userEvent.keyboard("{Enter}");
    const code = await canvas.findByLabelText("Verification code");
    await expect(code).toHaveFocus();
    await userEvent.type(code, "abc-123");
    await userEvent.keyboard("{Enter}");
    await expect(await canvas.findByRole("heading", { name: "Email changed" })).toHaveFocus();
  },
};
