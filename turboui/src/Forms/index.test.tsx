import * as React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";

import { emptyContent } from "../RichContent/contentOps";
import { createMockRichEditorHandlers } from "../utils/storybook/richEditor";
import {
  AccessSelectors,
  Form,
  FormError,
  NumberInput,
  PasswordInput,
  RichTextArea,
  SelectBox,
  Submit,
  TextInput,
  useForm,
  validateIsNumber,
  validateTextLength,
} from ".";

jest.mock("../RichEditor", () => ({
  Editor: (props: { hideBorder?: boolean; className?: string }) => (
    <div
      data-testid="rich-editor"
      data-hide-border={props.hideBorder ? "true" : "false"}
      className={props.className}
    />
  ),
  useEditor: (props: { content?: unknown }) => ({
    editor: {
      commands: { setContent: jest.fn() },
      getJSON: () => props.content ?? null,
    },
    localDraftRestored: false,
    clearLocalDraft: () => undefined,
  }),
}));

jest.mock("../icons", () => ({
  IconCheck: () => <svg data-testid="icon-check" />,
  IconBuilding: () => <svg data-testid="icon-building" />,
  IconTent: () => <svg data-testid="icon-tent" />,
}));

jest.mock("react-select", () => {
  return function MockSelect({
    options,
    value,
    onChange,
  }: {
    options: { label: string; value: string | number }[];
    value?: { label: string; value: string | number };
    onChange: (option: { label: string; value: string | number } | null) => void;
  }) {
    return (
      <select
        aria-label="select-box"
        value={value?.value ?? ""}
        onChange={(event) => {
          const option = options.find((item) => String(item.value) === event.target.value) ?? null;
          onChange(option);
        }}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    );
  };
});

describe("Forms", () => {
  test("updates nested field paths and submits the latest values", async () => {
    const onSubmit = jest.fn();

    function Harness() {
      const form = useForm({
        fields: {
          items: [{ name: "Roadmap" }],
        },
        submit: async () => {
          onSubmit(form.values);
        },
      });

      return (
        <Form form={form}>
          <TextInput field="items[0].name" label="Name" />
          <Submit />
        </Form>
      );
    }

    render(<Harness />);

    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Launch Plan" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({
        items: [{ name: "Launch Plan" }],
      }),
    );
  });

  test("shows required validation errors for text inputs", async () => {
    const onSubmit = jest.fn();

    function Harness() {
      const form = useForm({
        fields: { name: "" },
        submit: async () => {
          onSubmit();
        },
      });

      return (
        <Form form={form}>
          <TextInput field="name" label="Name" required />
          <Submit />
        </Form>
      );
    }

    render(<Harness />);

    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByText("Can't be empty")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  test("assigns a default sanitized test id from the field name", () => {
    function Harness() {
      const form = useForm({
        fields: { items: [{ name: "Roadmap" }] },
        submit: async () => undefined,
      });

      return (
        <Form form={form}>
          <TextInput field="items[0].name" label="Name" />
        </Form>
      );
    }

    const { container } = render(<Harness />);

    expect(container.querySelector('[data-test-id="items-0-name"]')).toBeInTheDocument();
  });

  test("supports adding and removing submit errors through form actions", async () => {
    function Harness() {
      const form = useForm({
        fields: { name: "" },
        submit: async () => undefined,
      });

      return (
        <Form form={form}>
          <TextInput field="name" label="Name" />
          <FormError when={!!form.errors._submit} message={form.errors._submit} />
          <button type="button" onClick={() => form.actions.addErrors({ _submit: "Save failed" })}>
            Add submit error
          </button>
          <button type="button" onClick={() => form.actions.removeErrors(["_submit"])}>
            Remove submit error
          </button>
        </Form>
      );
    }

    render(<Harness />);

    fireEvent.click(screen.getByRole("button", { name: "Add submit error" }));
    expect(await screen.findByText("Save failed")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Remove submit error" }));
    await waitFor(() => expect(screen.queryByText("Save failed")).not.toBeInTheDocument());
  });

  test("calls onError when submit fails", async () => {
    const onError = jest.fn();
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation(() => undefined);

    function Harness() {
      const form = useForm({
        fields: { name: "Roadmap" },
        onError,
        submit: async () => {
          throw new Error("submit failed");
        },
      });

      return (
        <Form form={form}>
          <TextInput field="name" label="Name" />
          <Submit />
        </Form>
      );
    }

    render(<Harness />);

    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => expect(onError).toHaveBeenCalledTimes(1));

    consoleErrorSpy.mockRestore();
  });

  test("updates select box values", async () => {
    const onSubmit = jest.fn();

    function Harness() {
      const form = useForm({
        fields: { status: "true" },
        submit: async () => {
          onSubmit(form.values);
        },
      });

      return (
        <Form form={form}>
          <SelectBox
            field="status"
            label="Status"
            options={[
              { value: "true", label: "Active" },
              { value: "false", label: "Inactive" },
            ]}
          />
          <Submit />
        </Form>
      );
    }

    render(<Harness />);

    fireEvent.change(screen.getByLabelText("select-box"), { target: { value: "false" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({
        status: "false",
      }),
    );
  });

  test("updates select box values with numeric options", async () => {
    const onSubmit = jest.fn();

    function Harness() {
      const form = useForm({
        fields: { accessLevel: 10 },
        submit: async () => {
          onSubmit(form.values);
        },
      });

      return (
        <Form form={form}>
          <SelectBox
            field="accessLevel"
            label="Access"
            options={[
              { value: 10, label: "View Access" },
              { value: 100, label: "Full Access" },
            ]}
          />
          <Submit />
        </Form>
      );
    }

    render(<Harness />);

    fireEvent.change(screen.getByLabelText("select-box"), { target: { value: "100" } });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({
        accessLevel: 100,
      }),
    );
  });

  test("updates the trigger through form actions", async () => {
    function Harness() {
      const form = useForm({
        fields: { name: "" },
        submit: async () => undefined,
      });

      return (
        <Form form={form}>
          <div data-testid="trigger-value">{form.trigger ?? "none"}</div>
          <button type="button" onClick={() => form.actions.setTrigger("draft")}>
            Set draft trigger
          </button>
        </Form>
      );
    }

    render(<Harness />);

    expect(screen.getByTestId("trigger-value")).toHaveTextContent("none");

    fireEvent.click(screen.getByRole("button", { name: "Set draft trigger" }));

    expect(await screen.findByTestId("trigger-value")).toHaveTextContent("draft");
  });

  test("resets field values before invoking cancel", () => {
    const onCancel = jest.fn();

    function Harness() {
      const form = useForm({
        fields: { name: "Roadmap" },
        cancel: async () => {
          onCancel();
        },
        submit: async () => undefined,
      });

      return (
        <Form form={form}>
          <TextInput field="name" label="Name" />
          <Submit />
        </Form>
      );
    }

    render(<Harness />);

    const input = screen.getByLabelText("Name");

    fireEvent.change(input, { target: { value: "Renamed" } });
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(input).toHaveValue("Roadmap");
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  test("hides editor border when hideBorder is set", () => {
    function Harness() {
      const form = useForm({
        fields: { body: emptyContent() },
        submit: async () => undefined,
      });

      return (
        <Form form={form}>
          <RichTextArea field="body" hideBorder richTextHandlers={createMockRichEditorHandlers()} />
        </Form>
      );
    }

    render(<Harness />);

    expect(screen.getByTestId("rich-editor")).toHaveAttribute("data-hide-border", "true");
  });

  test("shows editor border by default", () => {
    function Harness() {
      const form = useForm({
        fields: { body: emptyContent() },
        submit: async () => undefined,
      });

      return (
        <Form form={form}>
          <RichTextArea field="body" richTextHandlers={createMockRichEditorHandlers()} />
        </Form>
      );
    }

    render(<Harness />);

    expect(screen.getByTestId("rich-editor")).toHaveAttribute("data-hide-border", "false");
  });

  test("shows required validation errors for rich text areas", async () => {
    const onSubmit = jest.fn();

    function Harness() {
      const form = useForm({
        fields: { description: emptyContent() },
        submit: async () => {
          onSubmit();
        },
      });

      return (
        <Form form={form}>
          <RichTextArea
            field="description"
            label="Description"
            required
            richTextHandlers={createMockRichEditorHandlers()}
          />
          <Submit />
        </Form>
      );
    }

    render(<Harness />);

    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByText("Can't be empty")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  test("supports text input min and max length validation", async () => {
    const onSubmit = jest.fn();

    function Harness() {
      const form = useForm({
        fields: { name: "hi", code: "toolong" },
        submit: async () => {
          onSubmit();
        },
      });

      return (
        <Form form={form}>
          <TextInput field="name" label="Name" minLength={3} />
          <TextInput field="code" label="Code" maxLength={4} />
          <Submit />
        </Form>
      );
    }

    render(<Harness />);

    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByText("Must be at least 3 characters long")).toBeInTheDocument();
    expect(await screen.findByText("Must be at most 4 characters long")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  test("supports hidden text inputs", () => {
    function Harness() {
      const form = useForm({
        fields: { secret: "hidden value" },
        submit: async () => undefined,
      });

      return (
        <Form form={form}>
          <TextInput field="secret" label="Secret" hidden />
        </Form>
      );
    }

    render(<Harness />);

    expect(screen.queryByLabelText("Secret")).not.toBeInTheDocument();
  });

  test("calls the text input onEnter handler", () => {
    const onEnter = jest.fn();

    function Harness() {
      const form = useForm({
        fields: { name: "" },
        submit: async () => undefined,
      });

      return (
        <Form form={form}>
          <TextInput field="name" label="Name" onEnter={onEnter} />
        </Form>
      );
    }

    render(<Harness />);

    fireEvent.keyDown(screen.getByLabelText("Name"), { key: "Enter" });

    expect(onEnter).toHaveBeenCalledTimes(1);
  });

  test("renders the text input ok sign when the field has no error", () => {
    function Harness() {
      const form = useForm({
        fields: { name: "Ready" },
        submit: async () => undefined,
      });

      return (
        <Form form={form}>
          <TextInput field="name" label="Name" okSign />
        </Form>
      );
    }

    render(<Harness />);

    expect(screen.getByTestId("icon-check")).toBeInTheDocument();
  });

  describe("validateTextLength", () => {
    test("adds error when value is shorter than minLength", () => {
      const addError = jest.fn();
      const validation = validateTextLength(8);

      validation("password", "short", addError);

      expect(addError).toHaveBeenCalledWith("password", "Must be at least 8 characters long");
    });

    test("adds error when value exceeds maxLength", () => {
      const addError = jest.fn();
      const validation = validateTextLength(undefined, 5);

      validation("name", "too long", addError);

      expect(addError).toHaveBeenCalledWith("name", "Must be at most 5 characters long");
    });

    test("passes when value is within bounds", () => {
      const addError = jest.fn();
      const validation = validateTextLength(3, 10);

      validation("name", "valid", addError);

      expect(addError).not.toHaveBeenCalled();
    });
  });

  describe("validateIsNumber", () => {
    test("passes for valid numbers", () => {
      const addError = jest.fn();
      const validation = validateIsNumber();

      validation("port", "587", addError);

      expect(addError).not.toHaveBeenCalled();
    });

    test("allows empty values", () => {
      const addError = jest.fn();
      const validation = validateIsNumber();

      validation("port", "", addError);

      expect(addError).not.toHaveBeenCalled();
    });

    test("adds error for invalid strings", () => {
      const addError = jest.fn();
      const validation = validateIsNumber();

      validation("port", "abc", addError);

      expect(addError).toHaveBeenCalledWith("port", "Must be a valid number");
    });
  });

  test("shows validation errors for password and number inputs", async () => {
    const onSubmit = jest.fn();

    function Harness() {
      const form = useForm({
        fields: { password: "", port: "abc" },
        submit: async () => {
          onSubmit();
        },
      });

      return (
        <Form form={form}>
          <PasswordInput field="password" label="Password" minLength={8} />
          <NumberInput field="port" label="Port" />
          <Submit />
        </Form>
      );
    }

    render(<Harness />);

    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByText("Can't be empty")).toBeInTheDocument();
    expect(await screen.findByText("Must be a valid number")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  test("shows the default form error when the form has validation errors", async () => {
    function Harness() {
      const form = useForm({
        fields: { name: "" },
        submit: async () => undefined,
      });

      return (
        <Form form={form}>
          <TextInput field="name" label="Name" required />
          <FormError />
          <Submit />
        </Form>
      );
    }

    render(<Harness />);

    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    expect(await screen.findByText("Please fix the errors above.")).toBeInTheDocument();
  });

  test("supports submit layout, sizing, and custom ids", () => {
    function Harness() {
      const form = useForm({
        fields: { name: "Roadmap" },
        cancel: async () => undefined,
        submit: async () => undefined,
      });

      return (
        <Form form={form}>
          <TextInput field="name" label="Name" />
          <Submit
            saveText="Publish"
            layout="centered"
            buttonSize="base"
            containerClassName="custom-submit-container"
            testId="publish-button"
          />
        </Form>
      );
    }

    const { container } = render(<Harness />);

    const saveButton = container.querySelector('[data-test-id="publish-button"]');
    const cancelButton = container.querySelector('[data-test-id="cancel"]');

    expect(saveButton).toBeInTheDocument();
    expect(cancelButton).toBeInTheDocument();
    const submitContainer = saveButton?.parentElement;

    expect(saveButton).toHaveAttribute("type", "button");
    expect(saveButton).toHaveClass("px-4", "py-2");
    expect(cancelButton).toHaveClass("px-4", "py-2");
    expect(submitContainer).toHaveClass("justify-center", "custom-submit-container");
  });

  test("uses submit button type when submitOnEnter is enabled", () => {
    function Harness() {
      const form = useForm({
        fields: { name: "Roadmap" },
        submit: async () => undefined,
      });

      return (
        <Form form={form}>
          <TextInput field="name" label="Name" />
          <Submit submitOnEnter />
        </Form>
      );
    }

    render(<Harness />);

    expect(screen.getByRole("button", { name: "Save" })).toHaveAttribute("type", "submit");
  });

  test("renders company-only access selectors for spaces", () => {
    function Harness() {
      const form = useForm({
        fields: {
          access: {
            companyMembers: 100,
            companyMembersOptions: [
              { value: 0, label: "No Access" },
              { value: 100, label: "Full Access" },
            ],
          },
        },
        submit: async () => undefined,
      });

      return (
        <Form form={form}>
          <AccessSelectors showSpaceAccess={false} />
        </Form>
      );
    }

    render(<Harness />);

    expect(screen.getByText("Company members")).toBeInTheDocument();
    expect(screen.queryByText("Space members")).not.toBeInTheDocument();
  });

  test("hides the company selector when no access is the only option on company-only forms", () => {
    function Harness() {
      const form = useForm({
        fields: {
          access: {
            companyMembers: 0,
            companyMembersOptions: [{ value: 0, label: "No Access" }],
          },
        },
        submit: async () => undefined,
      });

      return (
        <Form form={form}>
          <AccessSelectors showSpaceAccess={false} />
        </Form>
      );
    }

    render(<Harness />);

    expect(screen.queryByText("Company members")).not.toBeInTheDocument();
    expect(screen.queryByText("Space members")).not.toBeInTheDocument();
  });

  test("keeps the company selector visible when space access is also shown", () => {
    function Harness() {
      const form = useForm({
        fields: {
          access: {
            companyMembers: 0,
            spaceMembers: 0,
            companyMembersOptions: [{ value: 0, label: "No Access" }],
            spaceMembersOptions: [
              { value: 100, label: "Full Access" },
              { value: 0, label: "No Access" },
            ],
          },
        },
        submit: async () => undefined,
      });

      return (
        <Form form={form}>
          <AccessSelectors />
        </Form>
      );
    }

    render(<Harness />);

    expect(screen.getByText("Company members")).toBeInTheDocument();
    expect(screen.getByText("Space members")).toBeInTheDocument();
  });
});
