/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import React, { act } from "react";
import { createRoot, Root } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router";
import Api from "@/api";
import { waitFor } from "@/__tests__/renderHook";
import { logIn } from "@/routes/auth";
import PageModule from "./index";

jest.mock("@/layouts/header", () => ({ useDocumentTitle: jest.fn() }));
jest.mock("@/routes/auth", () => ({ logIn: jest.fn() }));

const details = {
  email: "alex@example.com",
  name: "Alex Morgan",
  password: "ValidPassword123",
  confirmPassword: "ValidPassword123",
};

let container: HTMLDivElement;
let root: Root;
let client: QueryClient;

beforeEach(async () => {
  (globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
  window.history.replaceState({}, "", "/signup?invite_token=invitation&redirect_to=%2Fwelcome");
  jest.useFakeTimers({ doNotFake: ["nextTick", "setImmediate", "setTimeout", "clearTimeout"] });
  jest.spyOn(console, "error").mockImplementation(() => {});
  container = document.createElement("div");
  document.body.appendChild(container);
  root = createRoot(container);
  client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  await act(async () => {
    root.render(
      <QueryClientProvider client={client}>
        <MemoryRouter>
          <PageModule.Page />
        </MemoryRouter>
      </QueryClientProvider>,
    );
  });
});

afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
  client.clear();
  jest.useRealTimers();
  jest.restoreAllMocks();
  jest.clearAllMocks();
});

function input(field: string) {
  const element = container.querySelector<HTMLInputElement>(`input[name="${field}"]`);
  if (!element) throw new Error(`Missing input: ${field}`);
  return element;
}

async function edit(field: string, value: string) {
  const element = input(field);
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
  if (!setter) throw new Error("Missing native input value setter");
  await act(async () => {
    setter.call(element, value);
    element.dispatchEvent(new Event("input", { bubbles: true }));
  });
}

async function fillDetails() {
  for (const [field, value] of Object.entries(details)) await edit(field, value);
}

async function submit() {
  const button = container.querySelector<HTMLButtonElement>("[data-test-id=submit]");
  if (!button) throw new Error("Missing signup submit button");
  await act(async () => button.click());
  await waitFor(() => expect(container.querySelector("[data-test-id=submit]")?.hasAttribute("disabled")).toBe(false));
}

function submissionError(message: string) {
  return { response: { data: { message } } };
}

test("malformed email shows an inline error, blocks submission, and proceeds after correction", async () => {
  const activation = jest.spyOn(Api.default, "createEmailActivationCode").mockResolvedValue({});
  expect(container.querySelector("#email-error")).toBeNull();
  expect(input("email").hasAttribute("aria-invalid")).toBe(false);

  await fillDetails();
  await edit("email", "");
  expect(container.querySelector("#email-error")).toBeNull();
  await submit();
  expect(input("email").getAttribute("aria-invalid")).toBe("true");
  expect(activation).not.toHaveBeenCalled();

  await edit("email", "alex@");
  expect(container.querySelector("#email-error")?.textContent).toBe("Enter a valid email address.");
  expect(input("email").getAttribute("aria-invalid")).toBe("true");
  expect(input("email").getAttribute("aria-describedby")).toBe("email-error");

  await submit();
  expect(activation).not.toHaveBeenCalled();
  expect(container.querySelector("input[name=code]")).toBeNull();

  await edit("email", details.email);
  expect(container.querySelector("#email-error")).toBeNull();
  expect(input("email").hasAttribute("aria-invalid")).toBe(false);
  expect(input("email").hasAttribute("aria-describedby")).toBe(false);
  for (const [field, value] of Object.entries(details)) expect(input(field).value).toBe(value);

  await submit();
  expect(activation).toHaveBeenCalledTimes(1);
  expect(activation).toHaveBeenCalledWith({ email: details.email });
  expect(input("code").value).toBe("");
});

test("form submission validates malformed email and correction preserves unrelated field errors", async () => {
  const activation = jest.spyOn(Api.default, "createEmailActivationCode").mockResolvedValue({});
  await fillDetails();
  await edit("email", "alex@");
  const form = container.querySelector("form");
  if (!form) throw new Error("Missing signup form");
  await act(async () => {
    form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
  });
  expect(activation).not.toHaveBeenCalled();
  expect(container.querySelector("input[name=code]")).toBeNull();
  expect(input("email").getAttribute("aria-invalid")).toBe("true");

  await edit("confirmPassword", "DifferentPassword123");
  await submit();
  expect(container.querySelector("#confirmPassword-error")).not.toBeNull();
  await edit("email", details.email);
  expect(container.querySelector("#email-error")).toBeNull();
  expect(container.querySelector("#confirmPassword-error")).not.toBeNull();
});

test("verification alone requires a complete code and submits normalized email paste to server verification", async () => {
  const activation = jest.spyOn(Api.default, "createEmailActivationCode").mockResolvedValue({});
  const account = jest.spyOn(Api.default, "createAccount").mockRejectedValue(submissionError("Server rejected code"));
  await fillDetails();
  await submit();
  expect(activation).toHaveBeenCalledWith({ email: details.email });

  await submit();
  expect(account).not.toHaveBeenCalled();
  expect(input("code").getAttribute("aria-invalid")).toBe("true");
  expect(container.querySelector("#code-error")).not.toBeNull();
  await edit("code", "ABC");
  await submit();
  expect(account).not.toHaveBeenCalled();

  await act(async () => {
    input("code").select();
    const paste = new Event("paste", { bubbles: true, cancelable: true });
    Object.defineProperty(paste, "clipboardData", { value: { getData: () => " ABC-123\n" } });
    input("code").dispatchEvent(paste);
  });
  expect(input("code").value).toBe("ABC123");
  expect(container.querySelector("#code-error")).toBeNull();
  await act(async () => {
    input("code").dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
  });
  await waitFor(() => expect(container.querySelector("[role=alert]")?.textContent).toBe("Server rejected code"));
  expect(account).toHaveBeenCalledWith({
    inviteToken: "invitation",
    code: "ABC123",
    email: details.email,
    fullName: details.name,
    password: details.password,
  });
  expect(logIn).not.toHaveBeenCalled();
});

test.each([
  ["email", "alex.updated@example.com"],
  ["name", "Alex Updated"],
  ["password", "UpdatedPassword123"],
  ["confirmPassword", "UpdatedPassword123"],
])(
  "editing %s clears the details error, retains values, and supports failed and successful retries",
  async (field, value) => {
    const request = jest
      .spyOn(Api.default, "createEmailActivationCode")
      .mockRejectedValueOnce(submissionError("First details failure"))
      .mockRejectedValueOnce(submissionError("New details failure"))
      .mockResolvedValueOnce({});
    await fillDetails();
    await submit();
    expect(container.querySelector("[role=alert]")?.textContent).toBe("First details failure");

    await edit(field, value);
    expect(container.querySelector("[role=alert]")).toBeNull();
    for (const [name, original] of Object.entries(details)) {
      expect(input(name).value).toBe(name === field ? value : original);
    }

    if (field === "password" || field === "confirmPassword") {
      // Mismatched passwords still block requests through the existing field validation.
      await submit();
      expect(request).toHaveBeenCalledTimes(1);
      await edit(field === "password" ? "confirmPassword" : "password", value);
    }
    await submit();
    expect(container.querySelector("[role=alert]")?.textContent).toBe("New details failure");
    await submit();
    expect(container.querySelector("[role=alert]")).toBeNull();
    expect(input("code").value).toBe("");
    expect(request).toHaveBeenCalledTimes(3);
    expect(request).toHaveBeenLastCalledWith({ email: field === "email" ? value : details.email });
  },
);

test("editing the code clears the account error and retries with retained signup details", async () => {
  jest.spyOn(Api.default, "createEmailActivationCode").mockResolvedValue({});
  const request = jest
    .spyOn(Api.default, "createAccount")
    .mockRejectedValueOnce(submissionError("First code failure"))
    .mockRejectedValueOnce(submissionError("New code failure"))
    .mockResolvedValueOnce({});
  await fillDetails();
  await submit();
  await edit("code", "OLD123");
  await submit();
  expect(container.querySelector("[role=alert]")?.textContent).toBe("First code failure");

  await edit("code", "NEW123");
  expect(container.querySelector("[role=alert]")).toBeNull();
  expect(input("code").value).toBe("NEW123");
  await submit();
  expect(container.querySelector("[role=alert]")?.textContent).toBe("New code failure");
  await submit();
  expect(container.querySelector("[role=alert]")).toBeNull();
  expect(request).toHaveBeenCalledTimes(3);
  expect(request).toHaveBeenLastCalledWith({
    inviteToken: "invitation",
    code: "NEW123",
    email: details.email,
    fullName: details.name,
    password: details.password,
  });
  expect(logIn).toHaveBeenCalledWith(details.email, details.password, { redirectTo: "/welcome" });
});

function resendButton() {
  const button = container.querySelector<HTMLButtonElement>("[data-test-id=resend-email-code]");
  if (!button) throw new Error("Missing resend action");
  return button;
}

async function finishCooldown() {
  await act(async () => jest.advanceTimersByTime(60_000));
}

async function resend() {
  await act(async () => resendButton().click());
}

function deferred<T>() {
  let resolve: (value: T) => void = () => {
    throw new Error("Deferred promise is not initialized");
  };
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

test("resend bypasses code validation, clears stale errors, and retains account, invitation, and redirect details", async () => {
  const activation = jest.spyOn(Api.default, "createEmailActivationCode").mockResolvedValue({});
  const account = jest
    .spyOn(Api.default, "createAccount")
    .mockRejectedValueOnce(submissionError("Expired code"))
    .mockResolvedValueOnce({});
  await fillDetails();
  await submit();
  await edit("code", "OLD123");
  await submit();
  expect(container.querySelector("[role=alert]")).not.toBeNull();
  await finishCooldown();
  await resend();
  expect(input("code").value).toBe("");
  expect(container.querySelector("[role=alert]")).toBeNull();
  expect(document.activeElement).toBe(input("code"));
  expect(container.querySelector("[data-test-id=resend-code-status]")?.getAttribute("data-state")).toBe("success");
  expect(activation).toHaveBeenLastCalledWith({ email: details.email });
  expect(account).toHaveBeenCalledTimes(1);
  expect(logIn).not.toHaveBeenCalled();
  expect(window.location.search).toBe("?invite_token=invitation&redirect_to=%2Fwelcome");

  await submit();
  expect(input("code").getAttribute("aria-invalid")).toBe("true");
  await edit("code", "ABC");
  await edit("code", "!");
  await finishCooldown();
  await resend();
  expect(input("code").value).toBe("");
  expect(input("code").hasAttribute("aria-invalid")).toBe(false);
  expect(container.querySelector("#code-error")).toBeNull();
  expect(activation).toHaveBeenCalledTimes(3);
  await edit("code", "NEW123");
  await submit();
  expect(account).toHaveBeenLastCalledWith({
    inviteToken: "invitation",
    code: "NEW123",
    email: details.email,
    fullName: details.name,
    password: details.password,
  });
  expect(logIn).toHaveBeenCalledWith(details.email, details.password, { redirectTo: "/welcome" });
});

test("pending resend and account creation exclude duplicate and concurrent requests, including Enter submission", async () => {
  const sending = deferred<{}>();
  const creating = deferred<{}>();
  const activation = jest
    .spyOn(Api.default, "createEmailActivationCode")
    .mockResolvedValueOnce({})
    .mockReturnValueOnce(sending.promise);
  const account = jest.spyOn(Api.default, "createAccount").mockReturnValueOnce(creating.promise);
  await fillDetails();
  await submit();
  await finishCooldown();
  // No entered code is required to resend.
  await resend();
  expect(resendButton().disabled).toBe(true);
  expect(container.querySelector<HTMLButtonElement>("[data-test-id=submit]")?.disabled).toBe(true);
  expect(container.querySelector("[data-test-id=resend-code-status]")?.getAttribute("data-state")).toBe("sending");
  await resend();
  await edit("code", "ABC123");
  await act(async () => {
    input("code").dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
  });
  expect(account).not.toHaveBeenCalled();
  expect(activation).toHaveBeenCalledTimes(2);
  await act(async () => sending.resolve({}));
  expect(resendButton().disabled).toBe(true);
  await finishCooldown();
  expect(resendButton().disabled).toBe(false);

  await edit("code", "NEW123");
  await act(async () => container.querySelector<HTMLButtonElement>("[data-test-id=submit]")?.click());
  await waitFor(() => expect(account).toHaveBeenCalledTimes(1));
  expect(resendButton().disabled).toBe(true);
  await resend();
  expect(activation).toHaveBeenCalledTimes(2);
  await act(async () => creating.resolve({}));
});

test("failed resend preserves entered values and permits a successful retry", async () => {
  const activation = jest
    .spyOn(Api.default, "createEmailActivationCode")
    .mockResolvedValueOnce({})
    .mockRejectedValueOnce(new Error("Offline"))
    .mockResolvedValueOnce({});
  const account = jest.spyOn(Api.default, "createAccount").mockResolvedValue({});
  await fillDetails();
  await submit();
  await edit("code", "OLD123");
  await finishCooldown();
  await resend();
  expect(input("code").value).toBe("OLD123");
  expect(container.querySelector("[data-test-id=resend-code-error][role=alert]")).not.toBeNull();
  expect(container.querySelector("[data-test-id=resend-code-status]")?.getAttribute("data-state")).toBe("error");
  expect(resendButton().disabled).toBe(true);
  await finishCooldown();
  expect(resendButton().disabled).toBe(false);
  expect(account).not.toHaveBeenCalled();
  expect(logIn).not.toHaveBeenCalled();
  await resend();
  expect(container.querySelector("[data-test-id=resend-code-error]")).toBeNull();
  expect(input("code").value).toBe("");
  expect(activation).toHaveBeenCalledTimes(3);
  await edit("code", "NEW123");
  await submit();
  expect(account).toHaveBeenCalledWith({
    inviteToken: "invitation",
    code: "NEW123",
    email: details.email,
    fullName: details.name,
    password: details.password,
  });
  expect(logIn).toHaveBeenCalledWith(details.email, details.password, { redirectTo: "/welcome" });
});

test("resend waits 60 seconds after the initial code and every resend without blocking verification", async () => {
  const activation = jest.spyOn(Api.default, "createEmailActivationCode").mockResolvedValue({});
  const account = jest.spyOn(Api.default, "createAccount").mockResolvedValue({});
  await fillDetails();
  await submit();
  expect(resendButton().disabled).toBe(true);
  await resend();
  expect(activation).toHaveBeenCalledTimes(1);
  await act(async () => jest.advanceTimersByTime(59_000));
  expect(resendButton().disabled).toBe(true);
  await act(async () => jest.advanceTimersByTime(1000));
  expect(resendButton().disabled).toBe(false);
  await resend();
  expect(activation).toHaveBeenCalledTimes(2);
  expect(resendButton().disabled).toBe(true);
  await edit("code", "NEW123");
  await submit();
  expect(account).toHaveBeenCalledTimes(1);
});
