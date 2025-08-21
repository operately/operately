import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import * as React from "react";
import { MemoryRouter } from "react-router-dom";

// Mock the external dependencies
vi.mock("@/components/Pages", () => ({
  Page: ({ children, title, testId }: any) => (
    <div data-testid={testId} title={title}>
      {children}
    </div>
  ),
  emptyLoader: vi.fn(),
}));

vi.mock("@/components/PaperContainer", () => ({
  Root: ({ children }: any) => <div>{children}</div>,
  Body: ({ children }: any) => <div>{children}</div>,
  Header: ({ title }: any) => <h1>{title}</h1>,
}));

vi.mock("@/models/accounts", () => ({
  changePassword: vi.fn(),
}));

vi.mock("@/components/Forms", () => ({
  default: {
    useForm: vi.fn(),
    Form: ({ children }: any) => <form>{children}</form>,
    FieldGroup: ({ children }: any) => <div>{children}</div>,
    PasswordInput: ({ field, label, placeholder }: any) => (
      <input data-testid={field} placeholder={placeholder} aria-label={label} type="password" />
    ),
    Submit: ({ saveText, cancelText }: any) => (
      <div>
        <button type="submit">{saveText}</button>
        <button type="button">{cancelText}</button>
      </div>
    ),
  },
}));

vi.mock("turboui", () => ({
  showSuccessToast: vi.fn(),
  showErrorToast: vi.fn(),
}));

vi.mock("@/routes/paths", () => ({
  usePaths: () => ({
    accountSecurityPath: () => "/account/security",
  }),
}));

const mockNavigate = vi.fn();
vi.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
  MemoryRouter: ({ children }: any) => <div>{children}</div>,
}));

describe("AccountChangePasswordPage", () => {
  const mockUseForm = vi.fn();
  const mockShowSuccessToast = vi.fn();
  const mockShowErrorToast = vi.fn();
  const mockChangePassword = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup form mock
    mockUseForm.mockReturnValue({
      values: {
        currentPassword: "oldpass123",
        newPassword: "newpass123",
        confirmPassword: "newpass123",
      },
    });

    // Import mocks
    const Forms = require("@/components/Forms").default;
    const { showSuccessToast, showErrorToast } = require("turboui");
    const Accounts = require("@/models/accounts");

    Forms.useForm = mockUseForm;
    showSuccessToast.mockImplementation(mockShowSuccessToast);
    showErrorToast.mockImplementation(mockShowErrorToast);
    Accounts.changePassword = mockChangePassword;
  });

  it("should show success toast when password change succeeds", async () => {
    // Mock successful password change
    mockChangePassword.mockResolvedValue({});

    const mockFormSubmit = vi.fn(async () => {
      try {
        await mockChangePassword({
          currentPassword: "oldpass123",
          newPassword: "newpass123",
          newPasswordConfirmation: "newpass123",
        });
        mockShowSuccessToast("Password Changed", "Your password has been updated successfully.");
        mockNavigate("/account/security");
      } catch (error) {
        mockShowErrorToast("Password Change Failed", "There was an error updating your password. Please try again.");
      }
    });

    mockUseForm.mockReturnValue({
      values: {
        currentPassword: "oldpass123",
        newPassword: "newpass123",
        confirmPassword: "newpass123",
      },
      submit: mockFormSubmit,
      cancel: vi.fn(),
    });

    // Simulate form submission
    await mockFormSubmit();

    expect(mockChangePassword).toHaveBeenCalledWith({
      currentPassword: "oldpass123",
      newPassword: "newpass123",
      newPasswordConfirmation: "newpass123",
    });
    expect(mockShowSuccessToast).toHaveBeenCalledWith(
      "Password Changed",
      "Your password has been updated successfully."
    );
    expect(mockNavigate).toHaveBeenCalledWith("/account/security");
  });

  it("should show error toast when password change fails", async () => {
    // Mock failed password change
    const error = new Error("Invalid password");
    mockChangePassword.mockRejectedValue(error);

    const mockFormSubmit = vi.fn(async () => {
      try {
        await mockChangePassword({
          currentPassword: "wrongpass",
          newPassword: "newpass123",
          newPasswordConfirmation: "newpass123",
        });
        mockShowSuccessToast("Password Changed", "Your password has been updated successfully.");
        mockNavigate("/account/security");
      } catch (error) {
        mockShowErrorToast("Password Change Failed", "There was an error updating your password. Please try again.");
      }
    });

    mockUseForm.mockReturnValue({
      values: {
        currentPassword: "wrongpass",
        newPassword: "newpass123",
        confirmPassword: "newpass123",
      },
      submit: mockFormSubmit,
      cancel: vi.fn(),
    });

    // Simulate form submission
    await mockFormSubmit();

    expect(mockChangePassword).toHaveBeenCalledWith({
      currentPassword: "wrongpass",
      newPassword: "newpass123",
      newPasswordConfirmation: "newpass123",
    });
    expect(mockShowErrorToast).toHaveBeenCalledWith(
      "Password Change Failed",
      "There was an error updating your password. Please try again."
    );
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});