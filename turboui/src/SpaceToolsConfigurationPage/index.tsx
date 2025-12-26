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
  }

  export interface Props {
    title: string | string[];

    navigation?: Navigation.Item[];

    tools: ToolSettings;
    onToolsChange: (tools: ToolSettings) => void;

    onSave: () => Promise<void>;
    onCancel: () => void;

    isSubmitting?: boolean;
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
              title="Task board"
              description="Work together on tasks that don’t belong to a specific project."
              value={props.tools.tasksEnabled}
              onChange={(value) => props.onToolsChange({ ...props.tools, tasksEnabled: value })}
              testId="task-board"
            />
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
