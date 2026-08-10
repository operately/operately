import React from "react";

import { Page } from "../Page";
import { PrimaryButton, SecondaryButton } from "../Button";
import { SwitchToggle } from "../SwitchToggle";
import { Navigation } from "../Page/Navigation";

export namespace SpaceToolsConfigurationPage {
  export interface ToolSettings {
    discussionsEnabled: boolean;
    resourceHubEnabled: boolean;
    tasksEnabled: boolean;
    kpisEnabled: boolean;
    templatesEnabled: boolean;
  }

  export interface Props {
    title: string | string[];

    navigation?: Navigation.Item[];

    tools: ToolSettings;
    onToolsChange: (tools: ToolSettings) => void;

    onSave: () => Promise<void>;
    onCancel: () => void;

    isSubmitting?: boolean;

    // Whether to expose the experimental KPIs tool. Gated by the caller so the
    // row only appears for companies with the `space_kpis` feature enabled.
    showKpis?: boolean;

    // Whether to expose the experimental Templates tool. Gated by the caller
    // so the row only appears for companies with the `project_templates`
    // feature enabled.
    showTemplates?: boolean;
  }
}

export function SpaceToolsConfigurationPage(props: SpaceToolsConfigurationPage.Props) {
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await props.onSave();
  };

  return (
    <Page
      title={props.title}
      size="small"
      navigation={props.navigation}
      testId="space-tools-configuration-page"
    >
      <div className="py-12 px-20">
        <form onSubmit={handleSave}>
          <h1 className="text-3xl font-extrabold">Configure tools for this space</h1>

          <div className="mt-8 space-y-8">
            <ToolRow
              title="Discussions"
              description="Post announcements, pitch ideas, and discuss ideas with your team."
              value={props.tools.discussionsEnabled}
              onChange={(value) => props.onToolsChange({ ...props.tools, discussionsEnabled: value })}
              testId="discussions"
            />

            <ToolRow
              title="Documents & Files"
              description="A place to share rich text documents, images, videos, and other files."
              value={props.tools.resourceHubEnabled}
              onChange={(value) => props.onToolsChange({ ...props.tools, resourceHubEnabled: value })}
              testId="documents-and-files"
            />

            <ToolRow
              title="Tasks"
              description="Work together on tasks that don’t belong to a specific project."
              value={props.tools.tasksEnabled}
              onChange={(value) => props.onToolsChange({ ...props.tools, tasksEnabled: value })}
              testId="task-board"
            />

            {props.showTemplates && (
              <ToolRow
                title="Templates"
                description="Save reusable project structures and use them for recurring work."
                value={props.tools.templatesEnabled}
                onChange={(value) => props.onToolsChange({ ...props.tools, templatesEnabled: value })}
                testId="templates"
              />
            )}

            {props.showKpis && (
              <ToolRow
                title="KPIs"
                description="Track the numbers this space cares about and log updates on a weekly or monthly cadence."
                value={props.tools.kpisEnabled}
                onChange={(value) => props.onToolsChange({ ...props.tools, kpisEnabled: value })}
                testId="kpis"
              />
            )}
          </div>

          <div className="flex items-center gap-2 mt-10">
            <PrimaryButton type="submit" loading={props.isSubmitting} disabled={props.isSubmitting} testId="save">
              Save
            </PrimaryButton>
            <SecondaryButton type="button" onClick={props.onCancel} disabled={props.isSubmitting} testId="cancel">
              Cancel
            </SecondaryButton>
          </div>
        </form>
      </div>
    </Page>
  );
}

function ToolRow(props: {
  title: string;
  description: string;
  value: boolean;
  onChange: (value: boolean) => void;
  testId: string;
}) {
  return (
    <div className="flex items-center justify-between gap-8">
      <div className="max-w-3xl">
        <div className="text-2xl font-extrabold">{props.title}</div>
        <div className="text-sm font-semibold text-content-dimmed">{props.description}</div>
      </div>

      <div className="flex items-center">
        <SwitchToggle label="" labelHidden value={props.value} setValue={props.onChange} testId={props.testId} />
      </div>
    </div>
  );
}
