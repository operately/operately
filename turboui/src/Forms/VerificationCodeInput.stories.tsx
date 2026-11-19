import React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent, within } from "storybook/test";
import { useTranslation } from "react-i18next";
import { FieldGroup, Form, Submit, useForm, VerificationCodeInput } from ".";

function Harness({ onSubmit }: { onSubmit: (code: string) => void }) {
  const { t } = useTranslation();
  const form = useForm({ fields: { code: "" }, submit: async () => onSubmit(form.values.code) });
  return (
    <Form form={form} className="w-60 text-center">
      <FieldGroup>
        <VerificationCodeInput field="code" testId="code" autoFocus className="text-4xl text-center" />
      </FieldGroup>
      <Submit saveText={t("Continue ->")} className="w-60" />
    </Form>
  );
}

const meta = {
  title: "Components/Forms/VerificationCodeInput",
  component: Harness,
  parameters: { layout: "centered" },
  args: { onSubmit: fn() },
} satisfies Meta<typeof Harness>;
export default meta;
type Story = StoryObj<typeof meta>;

export const TypingAndCorrection: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("textbox");
    await userEvent.type(input, "ABC123");
    await expect(input).toHaveValue("ABC123");
    await userEvent.type(input, "!");
    await expect(input).toHaveAttribute("aria-invalid", "true");
    await userEvent.keyboard("{Enter}");
    await expect(args.onSubmit).not.toHaveBeenCalled();
    await userEvent.keyboard("{Backspace}9");
    await expect(input).toHaveValue("ABC129");
    await expect(input).not.toHaveAttribute("aria-invalid");
    // Replacing a selection and deleting must stay usable in a real browser.
    (input as HTMLInputElement).setSelectionRange(0, 3);
    await userEvent.keyboard("XYZ");
    await expect(input).toHaveValue("XYZ129");
    await userEvent.click(canvas.getByRole("button"));
    await expect(args.onSubmit).toHaveBeenCalledWith("XYZ129");
  },
};

export const EmailPaste: Story = {
  play: async ({ canvasElement, args }) => {
    const input = within(canvasElement).getByRole("textbox");
    await userEvent.click(input);
    await userEvent.paste(" \nABC-123\t");
    await expect(input).toHaveValue("ABC123");
    await userEvent.keyboard("{Enter}");
    await expect(args.onSubmit).toHaveBeenCalledWith("ABC123");
  },
};

export const ValidationFeedback: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const input = canvas.getByRole("textbox");
    await userEvent.type(input, "ABC");
    await userEvent.click(canvas.getByRole("button"));
    await expect(input).toHaveAttribute("aria-invalid", "true");
    await expect(input).toHaveAttribute("aria-describedby", "code-error");
    await expect(args.onSubmit).not.toHaveBeenCalled();
  },
};
