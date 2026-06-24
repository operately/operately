import * as React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";

import { emptyContent } from "../RichContent/contentOps";
import { createMockRichEditorHandlers } from "../utils/storybook/richEditor";
import {
  Form,
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
  Editor: () => <div data-testid="rich-editor" />,
  useEditor: (props: { content?: unknown }) => ({
    editor: {
      commands: { setContent: jest.fn() },
      getJSON: () => props.content ?? null,
    },
    localDraftRestored: false,
    clearLocalDraft: () => undefined,
  }),
}));

jest.mock("react-select", () => {
  return function MockSelect({
    options,
    value,
    onChange,
  }: {
    options: { label: string; value: string }[];
    value?: { label: string; value: string };
    onChange: (option: { label: string; value: string } | null) => void;
  }) {
    return (
      <select
        aria-label="select-box"
        value={value?.value ?? ""}
        onChange={(event) => {
          const option = options.find((item) => item.value === event.target.value) ?? null;
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
});
