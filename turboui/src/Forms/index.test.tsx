import * as React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";

import { emptyContent } from "../RichContent/contentOps";
import { createMockRichEditorHandlers } from "../utils/storybook/richEditor";
import { Form, RichTextArea, Submit, TextInput, useForm } from ".";

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
});
