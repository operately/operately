import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { FieldGroup, Form, Submit, useForm, VerificationCodeInput } from ".";

function setup() {
  const submit = jest.fn();
  function Harness() {
    const form = useForm({ fields: { code: "" }, submit: async () => submit(form.values.code) });
    return (
      <Form form={form}>
        <FieldGroup>
          <VerificationCodeInput field="code" label="Code" />
        </FieldGroup>
        <Submit />
      </Form>
    );
  }
  render(<Harness />);
  return { submit, input: screen.getByRole("textbox") as HTMLInputElement };
}

function paste(input: HTMLInputElement, text: string) {
  fireEvent.paste(input, { clipboardData: { getData: () => text } });
}

async function clickSubmit() {
  fireEvent.click(screen.getByRole("button"));
  await waitFor(() => expect(screen.getByRole("button")).toBeEnabled());
}

test("typing, deletion, and selection replacement allow a complete uppercase alphanumeric code", async () => {
  const { input, submit } = setup();
  for (const value of ["A", "AB", "ABC", "ABC1", "ABC12", "ABC123", "ABC12", "ABC1Z3"]) {
    fireEvent.change(input, { target: { value } });
    expect(input).toHaveValue(value);
  }
  await clickSubmit();
  expect(submit).toHaveBeenCalledWith("ABC1Z3");
});

test.each(["", "ABC"])("submission of %j shows associated feedback", async (value) => {
  const { input, submit } = setup();
  fireEvent.change(input, { target: { value } });
  await clickSubmit();
  expect(submit).not.toHaveBeenCalled();
  expect(input).toHaveAttribute("aria-invalid", "true");
  expect(input).toHaveAttribute("aria-describedby", "code-error");
  expect(document.getElementById("code-error")).toBeVisible();
});

test.each(["a", "!", "É", "ABC1234"])("rejected typing %j cannot submit a retained complete code", async (value) => {
  const { input, submit } = setup();
  fireEvent.change(input, { target: { value: "ABC123" } });
  fireEvent.change(input, { target: { value } });
  expect(input).toHaveValue("ABC123");
  expect(input).toHaveAttribute("aria-invalid", "true");
  await clickSubmit();
  fireEvent.keyDown(input, { key: "Enter" });
  expect(submit).not.toHaveBeenCalled();
  fireEvent.change(input, { target: { value: "ABC12" } });
  expect(input).not.toHaveAttribute("aria-invalid");
  fireEvent.change(input, { target: { value: "ABC129" } });
  fireEvent.keyDown(input, { key: "Enter" });
  await waitFor(() => expect(submit).toHaveBeenCalledWith("ABC129"));
});

test.each(["ABC123", "ABC-123", " \nABC123\t", "\tABC-123\n"])("paste %j submits the canonical code", async (code) => {
  const { input, submit } = setup();
  paste(input, code);
  expect(input).toHaveValue("ABC123");
  await clickSubmit();
  expect(submit).toHaveBeenCalledWith("ABC123");
});

test.each(["abc123", "ABC!23", "ABCÉ23", "ABC12", "ABC1234", "AB-C123", "ABC 123", "ABC--123", "ABC–123"])(
  "malformed paste %j blocks click and Enter until corrected",
  async (code) => {
    const { input, submit } = setup();
    fireEvent.change(input, { target: { value: "OLD123" } });
    input.select();
    paste(input, code);
    expect(input).toHaveValue("OLD123");
    expect(input).toHaveAttribute("aria-invalid", "true");
    await clickSubmit();
    fireEvent.keyDown(input, { key: "Enter" });
    expect(submit).not.toHaveBeenCalled();
    input.select();
    paste(input, "ABC-123");
    expect(input).not.toHaveAttribute("aria-invalid");
    await clickSubmit();
    expect(submit).toHaveBeenCalledWith("ABC123");
  },
);

test("paste validates the resulting selection replacement without truncating", async () => {
  const { input, submit } = setup();
  fireEvent.change(input, { target: { value: "OLD123" } });
  input.setSelectionRange(0, 3);
  paste(input, "ABC-123");
  expect(input).toHaveValue("OLD123");
  await clickSubmit();
  expect(submit).not.toHaveBeenCalled();
  input.select();
  paste(input, "ABC-123");
  await clickSubmit();
  expect(submit).toHaveBeenCalledWith("ABC123");
});
