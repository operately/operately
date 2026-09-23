import React from "react";
import { useTranslation } from "react-i18next";

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
  }
}

export function SpaceToolsConfigurationPage(props: SpaceToolsConfigurationPage.Props) {
  const { t } = useTranslation();
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
          <h1 className="text-3xl font-extrabold">{t("Configure tools for this space")}</h1>

          <div className="mt-8 space-y-8">
            <ToolRow
              title={t("Discussions")}
              description={t("Post announcements, pitch ideas, and discuss ideas with your team.")}
              value={props.tools.discussionsEnabled}
              onChange={(value) => props.onToolsChange({ ...props.tools, discussionsEnabled: value })}
              testId="discussions"
            />

            <ToolRow
              title={t("Documents & Files")}
              description={t("A place to share rich text documents, images, videos, and other files.")}
              value={props.tools.resourceHubEnabled}
              onChange={(value) => props.onToolsChange({ ...props.tools, resourceHubEnabled: value })}
              testId="documents-and-files"
            />

            <ToolRow
              title={t("Tasks")}
              description={t("Work together on tasks that don’t belong to a specific project.")}
              value={props.tools.tasksEnabled}
              onChange={(value) => props.onToolsChange({ ...props.tools, tasksEnabled: value })}
              testId="task-board"
            />

            <ToolRow
              title={t("Templates")}
              description={t("Save reusable project structures and use them for recurring work.")}
              value={props.tools.templatesEnabled}
              onChange={(value) => props.onToolsChange({ ...props.tools, templatesEnabled: value })}
              testId="templates"
            />

            <ToolRow
              title={t("KPIs")}
              description={t("Track the numbers this space cares about and log updates on a weekly or monthly cadence.")}
              value={props.tools.kpisEnabled}
              onChange={(value) => props.onToolsChange({ ...props.tools, kpisEnabled: value })}
              testId="kpis"
            />
          </div>

          <div className="flex items-center gap-2 mt-10">
            <PrimaryButton type="submit" loading={props.isSubmitting} disabled={props.isSubmitting} testId="save">
              {t("Save")}
            </PrimaryButton>
            <SecondaryButton type="button" onClick={props.onCancel} disabled={props.isSubmitting} testId="cancel">
              {t("Cancel")}
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
