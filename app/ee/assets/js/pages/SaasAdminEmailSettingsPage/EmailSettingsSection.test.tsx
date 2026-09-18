/** @jest-environment <rootDir>/../turboui/node_modules/jest-environment-jsdom */
import React from "react";
import axios from "axios";
import * as AdminApi from "@/ee/admin_api";
import { queryClient } from "@/api/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook } from "@/__tests__/renderHook";
import { EmailSettingsSection } from "./EmailSettingsSection";

let mockSubmit: () => Promise<void>;
let mockValues: Record<string, unknown>;
const mockSetValue = jest.fn();
jest.mock("axios");
jest.mock("@/ee/admin_api/staleClient", () => ({ handleStaleClientError: jest.fn() }));
jest.mock("./TestEmailModal", () => ({ TestEmailAction: () => null }));
jest.mock("turboui", () => ({
  PageSection: ({ children }: React.PropsWithChildren) => children,
  Forms: {
    useForm: (config: { submit: () => Promise<void> }) => {
      mockSubmit = config.submit;
      return { values: mockValues, actions: { setValue: mockSetValue } };
    },
    Form: () => null,
    FieldGroup: () => null,
    TextInput: () => null,
    RadioButtons: () => null,
    Submit: () => null,
  },
  Spacer: () => null,
}));
const wrapper = ({ children }: React.PropsWithChildren) => (
  <QueryClientProvider client={queryClient}>
    <EmailSettingsSection initialSettings={null} />
    {children}
  </QueryClientProvider>
);
beforeEach(() => {
  queryClient.clear();
  jest.resetAllMocks();
  AdminApi.default.default.setBasePath("/admin/api");
  mockValues = {
    provider: "sendgrid",
    notificationEmail: " sender@example.com ",
    sendgridApiKey: " replacement-key ",
    smtpHost: "",
    smtpPort: "",
    smtpUsername: "",
    smtpPassword: "",
    smtpSsl: false,
    smtpTlsRequired: false,
  };
});
afterEach(() => queryClient.clear());

it("saves normalized form values and clears secret fields after success", async () => {
  const emailSettings = { provider: "sendgrid", sendgridApiKeySet: true };
  jest.mocked(axios.post).mockResolvedValue({ data: { success: true, emailSettings } });
  renderHook(() => null, { initialProps: undefined, wrapper });
  await act(async () => {
    await mockSubmit();
  });
  expect(axios.post).toHaveBeenCalledWith(
    "/admin/api/update_email_settings",
    expect.objectContaining({
      notification_email: "sender@example.com",
      sendgrid_api_key: "replacement-key",
    }),
    expect.anything(),
  );
  expect(mockSetValue).toHaveBeenCalledWith("sendgridApiKey", "");
  expect(mockSetValue).toHaveBeenCalledWith("smtpPassword", "");
  expect(queryClient.getQueryData(AdminApi.getEmailSettingsQueryKey({}))).toEqual({ emailSettings });
});

it("keeps entered secrets and cached settings when saving fails", async () => {
  const key = AdminApi.getEmailSettingsQueryKey({});
  queryClient.setQueryData(key, { emailSettings: { provider: "smtp" } });
  jest.mocked(axios.post).mockResolvedValue({ data: { success: false, error: "Unable to save" } });
  renderHook(() => null, { initialProps: undefined, wrapper });
  await act(async () => {
    await mockSubmit();
  });
  expect(mockSetValue).not.toHaveBeenCalled();
  expect(queryClient.getQueryData(key)).toEqual({ emailSettings: { provider: "smtp" } });
});
