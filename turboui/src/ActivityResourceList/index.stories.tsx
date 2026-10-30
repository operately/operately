import React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";
import { ActivityResourceList, type ActivityResourceEntry } from ".";
import { useTranslation } from "react-i18next";
import { Trans } from "../Translate";
import en from "../../../app/assets/js/generated/locales/en.json";
import ptBR from "../../../app/assets/js/generated/locales/pt-BR.json";

const names = [
  "Triggers: Support pull request commit trigger",
  "Triggers: Support manual run trigger",
  "Triggers: Support scheduled trigger",
  "Tools: Support update task plan in MCP",
  "Triggers: Support webhook trigger",
  "Tools: Support add check in MCP",
  "Tools: Support move task in Bash",
  "Tools: Support move task in MCP",
  "Task <literal>, punctuation & names",
];
const entries = (count: number, type = "tasks"): ActivityResourceEntry[] =>
  Array.from({ length: count }, (_, index) => ({
    key: `${type}-${index}`,
    name: `${names[index % names.length]} (${index + 1})`,
    path: `/${type}/${index}`,
  }));

const meta = {
  title: "Components/ActivityResourceList",
  component: ActivityResourceList,
  args: { entries: entries(2), locale: "en" },
  decorators: [
    (Story, context) => {
      const { i18n } = useTranslation();
      i18n.addResourceBundle("en", "translation", en, true, true);
      i18n.addResourceBundle("pt-BR", "translation", ptBR, true, true);
      React.useEffect(() => {
        void i18n.changeLanguage(context.args.locale);
      }, [context.args.locale, i18n]);
      return (
        <div className="bg-surface-base text-content-accent min-h-screen p-4 sm:p-8">
          <div className="max-w-4xl text-sm font-bold break-words">
            {context.parameters.resourceType === "task" ? (
              <Trans
                i18nKey="{{author}} updated assignees on <tasks/>"
                values={{ author: "Igor" }}
                components={{ tasks: <Story /> }}
              />
            ) : (
              <Trans
                i18nKey="{{author}} updated milestones <milestones/>"
                values={{ author: "Igor" }}
                components={{ milestones: <Story /> }}
              />
            )}
          </div>
        </div>
      );
    },
  ],
} satisfies Meta<typeof ActivityResourceList>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = { args: { entries: [] } };
export const Short: Story = {};
export const ExactlyThree: Story = { args: { entries: entries(3) } };
export const Four: Story = { args: { entries: entries(4) } };
export const ThirtyTasks: Story = { args: { entries: entries(30) }, parameters: { resourceType: "task" } };
export const ThirtyMilestones: Story = { args: { entries: entries(30, "milestones") } };
export const Deletions: Story = {
  args: {
    entries: entries(30).map((entry) => ({
      ...entry,
      path: undefined,
      name: "Deleted <resource>, same name & punctuation",
    })),
  },
};
export const DuplicateFiltered: Story = { args: { entries: [...entries(4), ...entries(4)] } };
export const ChangeDetails: Story = {
  args: {
    entries: entries(4, "milestones").map((entry, index) => ({
      ...entry,
      details: (
        <Trans
          i18nKey={'Previously, the milestone was called <name>"{{oldTitle}}"</name>.'}
          values={{ oldTitle: `Previous milestone ${index + 1}` }}
          components={{ name: <strong /> }}
        />
      ),
    })),
  },
};
export const Portuguese: Story = { args: { entries: entries(30), locale: "pt-BR" } };
export const Expanded: Story = {
  args: { entries: entries(30) },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.getAllByRole("link")).toHaveLength(3);
    const toggle = canvas.getByRole("button");
    await userEvent.tab();
    toggle.focus();
    await userEvent.keyboard("{Enter}");
    await expect(toggle).toHaveAttribute("aria-expanded", "true");
    await expect(canvas.getAllByRole("link")).toHaveLength(30);
    await expect(toggle).toHaveFocus();
  },
};
