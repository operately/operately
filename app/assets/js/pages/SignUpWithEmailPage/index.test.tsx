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
