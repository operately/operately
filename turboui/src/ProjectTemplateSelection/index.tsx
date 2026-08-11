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
    inactiveDiscussionCount?: number;
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
      <SelectedTemplateFields
        templateId={templateId}
        peopleSummary={selectedTemplate?.inactivePeopleSummary}
        inactiveDiscussionCount={selectedTemplate?.inactiveDiscussionCount}
      />
    </>
  );
}

function SelectedTemplateFields({
  templateId,
  peopleSummary,
  inactiveDiscussionCount,
}: {
  templateId?: string | null;
  peopleSummary?: ProjectTemplateSelection.Template["inactivePeopleSummary"];
  inactiveDiscussionCount?: number;
}) {
  if (!templateId) return null;

  return (
    <>
      <InactivePeopleWarning summary={peopleSummary} />
      <InactiveDiscussionAuthorsWarning count={inactiveDiscussionCount} />
      <Forms.DateInput
        label="Project start date"
        field="startDate"
        required
        requiredMessage="Select a project start date."
      />
    </>
  );
}

function InactiveDiscussionAuthorsWarning({ count = 0 }: { count?: number }) {
  if (count === 0) return null;

  const discussions = count === 1 ? "1 discussion" : `${count} discussions`;
  const author = count === 1 ? "its original author is" : "their original authors are";

  return (
    <div
      className="rounded-lg border border-callout-warning-content bg-callout-warning-bg p-3 text-sm text-content-base"
      role="status"
    >
      <span className="font-semibold">
        {discussions} in this template will be attributed to you because {author} no longer active.
      </span>
    </div>
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
