import * as React from "react";
import Select from "react-select";

import { DateField } from "../DateField";
import * as Forms from "../Forms";
import { createTestId } from "../TestableElement";
import classNames from "../utils/classnames";
import { toDateWithoutTime } from "../utils/time";

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

export namespace ProjectTemplateFields {
  export type Template = ProjectTemplateSelection.Template;

  export interface Props {
    spaceId?: string | null;
    templates: Template[];
    templateId: string;
    onTemplateIdChange: (templateId: string) => void;
    startDate: string;
    onStartDateChange: (startDate: string) => void;
    startDateError?: string;
  }
}

export function ProjectTemplateSelection({ spaceId, templates }: ProjectTemplateSelection.Props) {
  const [templateId, setTemplateId] = Forms.useFieldValue<string>("template");
  const [startDate, setStartDate] = Forms.useFieldValue<string>("startDate");

  return (
    <ProjectTemplateFields
      spaceId={spaceId}
      templates={templates}
      templateId={templateId ?? ""}
      onTemplateIdChange={setTemplateId}
      startDate={startDate ?? ""}
      onStartDateChange={setStartDate}
      startDateField="startDate"
    />
  );
}

export function ProjectTemplateFields({
  spaceId,
  templates,
  templateId,
  onTemplateIdChange,
  startDate,
  onStartDateChange,
  startDateError,
  startDateField,
}: ProjectTemplateFields.Props & { startDateField?: string }) {
  const compatibleTemplates = React.useMemo(
    () => templates.filter((template) => template.spaceId === spaceId),
    [spaceId, templates],
  );
  const selectedTemplate = compatibleTemplates.find((template) => template.id === templateId);

  React.useEffect(() => {
    if (templateId && !compatibleTemplates.some((template) => template.id === templateId)) {
      onTemplateIdChange("");
      onStartDateChange("");
    }
  }, [compatibleTemplates, onStartDateChange, onTemplateIdChange, templateId]);

  if (!spaceId) return null;

  const options = [
    { value: "", label: "No template" },
    ...compatibleTemplates.map((template) => ({ value: template.id, label: template.name })),
  ];

  return (
    <>
      <div>
        <label className="font-bold text-sm mb-1 block text-left">Template</label>
        <div data-test-id="template" className="flex-1">
          <Select
            unstyled={true}
            className="flex-1"
            aria-label="Template"
            classNames={selectBoxClassNames(false)}
            value={options.find(({ value }) => value === templateId)}
            onChange={(option) => onTemplateIdChange(option?.value ?? "")}
            options={options}
            styles={selectBoxStyles()}
          />
        </div>
      </div>
      <SelectedTemplateFields
        templateId={templateId}
        peopleSummary={selectedTemplate?.inactivePeopleSummary}
        inactiveDiscussionCount={selectedTemplate?.inactiveDiscussionCount}
        startDate={startDate}
        onStartDateChange={onStartDateChange}
        startDateError={startDateError}
        startDateField={startDateField}
      />
    </>
  );
}

function SelectedTemplateFields({
  templateId,
  peopleSummary,
  inactiveDiscussionCount,
  startDate,
  onStartDateChange,
  startDateError,
  startDateField,
}: {
  templateId?: string | null;
  peopleSummary?: ProjectTemplateSelection.Template["inactivePeopleSummary"];
  inactiveDiscussionCount?: number;
  startDate: string;
  onStartDateChange: (startDate: string) => void;
  startDateError?: string;
  startDateField?: string;
}) {
  if (!templateId) return null;

  return (
    <>
      <InactivePeopleWarning summary={peopleSummary} />
      <InactiveDiscussionAuthorsWarning count={inactiveDiscussionCount} />
      {startDateField ? (
        <Forms.DateInput
          label="Project start date"
          field={startDateField}
          required
          requiredMessage="Select a project start date."
        />
      ) : (
        <ControlledStartDateField
          startDate={startDate}
          onStartDateChange={onStartDateChange}
          error={startDateError}
        />
      )}
    </>
  );
}

function ControlledStartDateField({
  startDate,
  onStartDateChange,
  error,
}: {
  startDate: string;
  onStartDateChange: (startDate: string) => void;
  error?: string;
}) {
  return (
    <div>
      <label className="font-bold text-sm mb-1 block text-left">
        Project start date <span className="text-content-dimmed">*</span>
      </label>
      <DateField
        id="startDate"
        date={isoDateToContextualDate(startDate)}
        onDateSelect={(date) => onStartDateChange(date ? toDateWithoutTime(date.date) : "")}
        variant="form-input"
        calendarOnly
        placeholder="Select a date"
        testId={createTestId("startDate")}
        error={!!error}
        ariaLabel="Project start date"
        ariaDescribedBy={error ? "startDate-error" : undefined}
        ariaRequired
      />
      {error && (
        <div id="startDate-error" className="text-red-500 text-xs mt-1" role="alert">
          {error}
        </div>
      )}
    </div>
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

function isoDateToContextualDate(value: string | undefined): DateField.ContextualDate | null {
  if (!value) return null;

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);

  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;

  return {
    date,
    dateType: "day",
    value: new Intl.DateTimeFormat(undefined, { year: "numeric", month: "short", day: "numeric" }).format(date),
  };
}

function selectBoxClassNames(error: boolean) {
  return {
    control: ({ isFocused }: { isFocused: boolean }) => selectBoxControlStyles(isFocused, error),
    menu: () => "bg-surface-base text-content-accent border border-surface-outline rounded-lg mt-1",
    option: selectBoxOptionStyles,
  };
}

function selectBoxControlStyles(isFocused: boolean, error: boolean) {
  if (error) {
    return "bg-surface-base placeholder-content-dimmed border border-red-500 rounded-lg px-3 flex-1";
  }

  if (isFocused) {
    return "bg-surface-base placeholder-content-subtle border-2 border-blue-600 rounded-lg px-3";
  }

  return "bg-surface-base placeholder-content-dimmed border border-surface-outline rounded-lg px-3 flex-1";
}

function selectBoxOptionStyles({ isFocused }: { isFocused: boolean }) {
  return classNames({
    "px-3 py-2 hover:bg-surface-accent cursor-pointer": true,
    "bg-surface-accent": isFocused,
  });
}

function selectBoxStyles() {
  return {
    input: (provided: Record<string, unknown>) => ({
      ...provided,
      "input:focus": {
        boxShadow: "none",
      },
    }),
  };
}
