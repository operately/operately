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
