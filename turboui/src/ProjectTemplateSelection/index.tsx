import * as React from "react";

import * as Forms from "../Forms";

export namespace ProjectTemplateSelection {
  export interface Template {
    id: string;
    name: string;
    spaceId: string;
    inactivePeopleSummary?: {
      personCount: number;
      roleCount: number;
      taskCount: number;
    };
  }

  export interface Props {
    spaceId?: string | null;
    templates: Template[];
  }
}

export function ProjectTemplateSelection({ spaceId, templates }: ProjectTemplateSelection.Props) {
  const [templateId, setTemplateId] = Forms.useFieldValue<string>("template");
  const [, setStartDate] = Forms.useFieldValue<string>("startDate");
  const compatibleTemplates = React.useMemo(
    () => templates.filter((template) => template.spaceId === spaceId),
    [spaceId, templates],
  );
  const selectedTemplate = compatibleTemplates.find((template) => template.id === templateId);

  React.useEffect(() => {
    if (templateId && !compatibleTemplates.some((template) => template.id === templateId)) {
      setTemplateId("");
      setStartDate("");
    }
  }, [compatibleTemplates, setStartDate, setTemplateId, templateId]);

  if (!spaceId) return null;

  return (
    <>
      <Forms.SelectBox
        label="Template"
        field="template"
        options={[
          { value: "", label: "No template" },
          ...compatibleTemplates.map((template) => ({ value: template.id, label: template.name })),
        ]}
      />
      <SelectedTemplateFields templateId={templateId} summary={selectedTemplate?.inactivePeopleSummary} />
    </>
  );
}

function SelectedTemplateFields({ templateId, summary }: { templateId?: string | null; summary?: ProjectTemplateSelection.Template["inactivePeopleSummary"] }) {
  if (!templateId) return null;

  return (
    <>
      <InactivePeopleWarning summary={summary} />
      <Forms.DateInput
        label="Project start date"
        field="startDate"
        required
        requiredMessage="Select a project start date."
      />
    </>
  );
}

function InactivePeopleWarning({ summary }: { summary?: ProjectTemplateSelection.Template["inactivePeopleSummary"] }) {
  if (!summary || summary.personCount === 0) return null;

  const people =
    summary.personCount === 1 ? "1 person in this template is" : `${summary.personCount} people in this template are`;
  const effects = [
    summary.roleCount === 1 ? "project role" : summary.roleCount > 1 ? `${summary.roleCount} project roles` : null,
    summary.taskCount === 1 ? "1 task" : summary.taskCount > 1 ? `${summary.taskCount} tasks` : null,
  ].filter((effect): effect is string => effect !== null);

  return (
    <div
      className="rounded-lg border border-callout-warning-content bg-callout-warning-bg p-3 text-sm text-content-base"
      role="status"
    >
      <span className="font-semibold">{people} no longer active.</span>{" "}
      {effects.length > 0 && `Their ${joinEffects(effects)} will be left unassigned.`}
    </div>
  );
}

function joinEffects(effects: string[]) {
  if (effects.length === 1) return effects[0];
  return `${effects[0]} and ${effects[1]}`;
}
