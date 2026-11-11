import React from "react";
import { useTranslation } from "react-i18next";

import { Page } from "../Page";
import { PrimaryButton, SecondaryButton } from "../Button";
import { SwitchToggle } from "../SwitchToggle";
import { Navigation } from "../Page/Navigation";

import { ToolManagement, type ToolManagementProps } from "./ToolManagement";
export type { ToolAction } from "./ToolManagement";

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
    management?: ToolManagementProps;
  }
}

export function SpaceToolsConfigurationPage(props: SpaceToolsConfigurationPage.Props) {
  const { t } = useTranslation();
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await props.onSave();
  };

  const visibilityDisabled = props.management?.canEdit === false || props.isSubmitting;

  return (
    <Page title={props.title} size="medium" navigation={props.navigation} testId="space-tools-configuration-page">
      <div className="py-10 px-6 sm:px-12">
        <h1 className="text-2xl font-extrabold">{t("Configure tools for this space")}</h1>
        <p className="mt-2 text-content-dimmed">{t("Choose which tools appear on the space page.")}</p>

        <div className="mt-8 divide-y divide-stroke-base" data-test-id="tool-management">
          <ToolSection
            title={t("Discussions")}
            description={t("Post announcements, pitch ideas, and discuss ideas with your team.")}
            value={props.tools.discussionsEnabled}
            onChange={(value) => props.onToolsChange({ ...props.tools, discussionsEnabled: value })}
            disabled={visibilityDisabled}
            testId="discussions"
          />
          <ToolSection
            title={t("Templates")}
            description={t("Save reusable project structures and use them for recurring work.")}
            value={props.tools.templatesEnabled}
            onChange={(value) => props.onToolsChange({ ...props.tools, templatesEnabled: value })}
            disabled={visibilityDisabled}
            testId="templates"
          />
          <ToolSection
            title={t("KPIs")}
            description={t("Track the numbers this space cares about and log updates on a weekly or monthly cadence.")}
            value={props.tools.kpisEnabled}
            onChange={(value) => props.onToolsChange({ ...props.tools, kpisEnabled: value })}
            disabled={visibilityDisabled}
            testId="kpis"
          />
          <ToolSection
            title={t("Tasks")}
            description={t("Work together on tasks that don’t belong to a specific project.")}
            value={props.tools.tasksEnabled}
            onChange={(value) => props.onToolsChange({ ...props.tools, tasksEnabled: value })}
            disabled={visibilityDisabled}
            testId="task-board"
          >
            {props.management && <ToolManagement {...props.management} kind="board" />}
          </ToolSection>
          <ToolSection
            title={t("Resource Hubs")}
            description={t("A place to share rich text documents, images, videos, and other files.")}
            value={props.tools.resourceHubEnabled}
            onChange={(value) => props.onToolsChange({ ...props.tools, resourceHubEnabled: value })}
            disabled={visibilityDisabled}
            testId="documents-and-files"
          >
            {props.management && <ToolManagement {...props.management} kind="hub" />}
          </ToolSection>
        </div>

        <form onSubmit={handleSave} className="mt-6 pt-6 border-t border-stroke-base">
          <fieldset disabled={visibilityDisabled} className="flex items-center gap-2">
            <PrimaryButton type="submit" loading={props.isSubmitting} disabled={visibilityDisabled} testId="save">
              {t("Save visibility")}
            </PrimaryButton>
            <SecondaryButton type="button" onClick={props.onCancel} disabled={visibilityDisabled} testId="cancel">
              {t("Cancel")}
            </SecondaryButton>
          </fieldset>
        </form>
      </div>
    </Page>
  );
}

function ToolSection(props: {
  title: string;
  description: string;
  value: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
  testId: string;
  children?: React.ReactNode;
}) {
  const { t } = useTranslation();
  const headingId = React.useId();

  return (
    <section className="py-6 first:pt-0" aria-labelledby={headingId}>
      <div className="flex flex-wrap items-start justify-between gap-x-8 gap-y-3">
        <div className="flex-1 min-w-[200px]">
          <h2 id={headingId} className="text-lg font-bold">
            {props.title}
          </h2>
          <p className="text-sm text-content-dimmed mt-1">{props.description}</p>
        </div>
        <fieldset disabled={props.disabled} className="flex items-center gap-3 pt-1">
          <span className="text-sm text-content-dimmed">{t("Show on space page")}</span>
          <SwitchToggle
            label={props.title}
            labelHidden
            value={props.value}
            setValue={props.onChange}
            testId={props.testId}
          />
        </fieldset>
      </div>
      {props.children && <div className="mt-5">{props.children}</div>}
    </section>
  );
}
