import type { Meta, StoryObj } from "@storybook/react-vite";
import React from "react";
import { createInstance } from "i18next";
import { I18nextProvider } from "react-i18next";
import { expect, fn, userEvent, within } from "storybook/test";
import { i18nOptions } from "../i18nOptions";
import { ProjectTemplateLifecycleDialogs } from ".";

const expandedCatalog = createInstance();
void expandedCatalog.init({
  ...i18nOptions,
  initImmediate: false,
  resources: {
    en: {
      translation: {
        "Archive “{{name}}”?": "Arquivar o template de projeto “{{name}}” para uso futuro?",
        "This template will leave project creation and can be restored later.":
          "Este template deixará de aparecer na criação de projetos. Você poderá restaurá-lo quando precisar utilizá-lo novamente.",
        "Archive template": "Confirmar arquivamento do template",
        "Keep active": "Manter este template ativo",
      },
    },
  },
});

const meta = {
  title: "Components/ProjectTemplateLifecycle",
  tags: ["pr6-i18n"],
  component: ProjectTemplateLifecycleDialogs,
  parameters: { layout: "fullscreen" },
  args: {
    action: "archive",
    template: { id: "template-1", name: "Launch <QA> & Sales" },
    onArchive: fn(async () => ({ success: true })),
    onDuplicate: fn(async () => ({ success: true })),
    onRestore: fn(async () => ({ success: true })),
    onDelete: fn(async () => ({ success: true })),
    onClose: fn(),
  },
} satisfies Meta<typeof ProjectTemplateLifecycleDialogs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Archive: Story = {};
export const ExpandedCatalog: Story = {
  decorators: [
    (Story) => (
      <I18nextProvider i18n={expandedCatalog}>
        <Story />
      </I18nextProvider>
    ),
  ],
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getByRole("heading")).toHaveTextContent(
      "Arquivar o template de projeto “Launch <QA> & Sales” para uso futuro?",
    );
    const dialog = canvasElement.querySelector(
      '[data-test-id="archive-project-template-dialog"]',
    ) as HTMLElement | null;
    if (!dialog) throw new Error("Archive dialog is missing");
    await expect(dialog.scrollWidth).toBeLessThanOrEqual(dialog.clientWidth);
    const confirm = canvas.getByRole("button", { name: "Confirmar arquivamento do template" });
    await expect(confirm.scrollWidth).toBeLessThanOrEqual(confirm.clientWidth);
    const bounds = dialog.getBoundingClientRect();
    for (const button of within(dialog).getAllByRole("button")) {
      const buttonBounds = button.getBoundingClientRect();
      await expect(buttonBounds.left).toBeGreaterThanOrEqual(bounds.left);
      await expect(buttonBounds.right).toBeLessThanOrEqual(bounds.right);
    }
    await userEvent.click(confirm);
    await expect(args.onArchive).toHaveBeenCalledWith("template-1");
  },
};
