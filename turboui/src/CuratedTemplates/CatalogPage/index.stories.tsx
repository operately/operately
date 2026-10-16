import React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { defaultFormattedTimePreferences } from "../../FormattedTime";
import { CuratedTemplatesCatalogPage } from "./index";
import { templateFixture } from "../mockData";
import type { TemplateType } from "../types";

export default { title: "Pages/CuratedTemplates/Catalog", parameters: { layout: "fullscreen" } } satisfies Meta;
type Story = StoryObj;

function CatalogStory({ empty = false }: { empty?: boolean }) {
  const [selectedType, setSelectedType] = React.useState<TemplateType>("project");
  const templates = empty ? [] : (["project", "goal", "kpi"] as const).map(templateFixture);
  return (
    <CuratedTemplatesCatalogPage
      templates={templates}
      selectedType={selectedType}
      onSelectedTypeChange={setSelectedType}
      createPath="/"
      administrationPath="/"
      templatePath={() => "/"}
      previewPath={(template) => `/?path=/story/pages-curatedtemplates-preview--${template.type}`}
      formattedTimePreferences={defaultFormattedTimePreferences}
    />
  );
}
export const Catalog: Story = { render: () => <CatalogStory /> };
export const EmptyCatalog: Story = { render: () => <CatalogStory empty /> };
