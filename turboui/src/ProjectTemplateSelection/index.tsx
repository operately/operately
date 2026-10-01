import { tn } from "../i18n";
import { Trans } from "../Translate";
import { useTranslation } from "react-i18next";
import * as React from "react";
import Select from "react-select";

import { DateField } from "../DateField";
import * as Forms from "../Forms";
import { IconPlus } from "../icons";
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
    onCreateTemplate?: () => void;
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
    onCreateTemplate?: () => void;
  }
}

const CREATE_TEMPLATE_OPTION = "create-project-template";

type TemplateOption = {
  value: string;
  label: string;
  kind: "none" | "template" | "create";
};

export function ProjectTemplateSelection({ spaceId, templates, onCreateTemplate }: ProjectTemplateSelection.Props) {
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
      onCreateTemplate={onCreateTemplate}
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
  onCreateTemplate,
}: ProjectTemplateFields.Props & { startDateField?: string }) {
  const { t } = useTranslation();
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

  const options: TemplateOption[] = [
    { value: "", label: t("No template"), kind: "none" },
    ...compatibleTemplates.map((template) => ({ value: template.id, label: template.name, kind: "template" as const })),
    ...(onCreateTemplate
      ? [{ value: CREATE_TEMPLATE_OPTION, label: t("Create a project template"), kind: "create" as const }]
      : []),
  ];

  const handleTemplateChange = (value: string) => {
    if (value === CREATE_TEMPLATE_OPTION) {
      onCreateTemplate?.();
      return;
    }

    onTemplateIdChange(value);
  };

  return (
    <>
      <div>
        <label className="font-bold text-sm mb-1 block text-left">{t("Template")}</label>
        <div data-test-id="template" className="flex-1">
          <Select
            unstyled={true}
            className="flex-1"
            aria-label={t("Template")}
            classNames={selectBoxClassNames(false)}
            value={options.find(({ value }) => value === templateId)}
            onChange={(option) => handleTemplateChange(option?.value ?? "")}
            options={options}
            formatOptionLabel={(option, { context }) =>
              context === "menu" && option.kind === "create" ? (
                <span className="flex items-center gap-2">
                  <IconPlus size={16} aria-hidden />
                  {option.label}
                </span>
              ) : (
                option.label
              )
            }
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
  const { t } = useTranslation();
  if (!templateId) return null;

  return (
    <>
      <InactivePeopleWarning summary={peopleSummary} />
      <InactiveDiscussionAuthorsWarning count={inactiveDiscussionCount} />
      {startDateField ? (
        <Forms.DateInput
          label={t("Project start date")}
          field={startDateField}
          required
          requiredMessage={t("Select a project start date.")}
        />
      ) : (
        <ControlledStartDateField startDate={startDate} onStartDateChange={onStartDateChange} error={startDateError} />
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
  const { t } = useTranslation();
  return (
    <div>
      <label className="font-bold text-sm mb-1 block text-left">
        <Trans
          i18nKey="Project start date <text>*</text>"
          components={{ text: <span className="text-content-dimmed" /> }}
        />
      </label>
      <DateField
        id="startDate"
        date={isoDateToContextualDate(startDate)}
        onDateSelect={(date) => onStartDateChange(date ? toDateWithoutTime(date.date) : "")}
        variant="form-input"
        calendarOnly
        placeholder={t("Select a date")}
        testId={createTestId("startDate")}
        error={!!error}
        ariaLabel={t("Project start date")}
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
  useTranslation();
  if (count === 0) return null;

  return (
    <div
      className="rounded-lg border border-callout-warning-content bg-callout-warning-bg p-3 text-sm text-content-base"
      role="status"
    >
      <span className="font-semibold">
        {tn(
          "1 discussion in this template will be attributed to you because its original author is no longer active.",
          "{{count}} discussions in this template will be attributed to you because their original authors are no longer active.",
          count,
        )}
      </span>
    </div>
  );
}

function InactivePeopleWarning({ summary }: { summary?: ProjectTemplateSelection.Template["inactivePeopleSummary"] }) {
  useTranslation();
  if (!summary || summary.personCount === 0) return null;

  return (
    <div
      className="rounded-lg border border-callout-warning-content bg-callout-warning-bg p-3 text-sm text-content-base"
      role="status"
    >
      <span className="font-semibold">
        {tn(
          "1 person in this template is no longer active.",
          "{{count}} people in this template are no longer active.",
          summary.personCount,
        )}
      </span>{" "}
      {inactiveAssignmentSummary(summary.roleCount, summary.taskCount)}
    </div>
  );
}

function inactiveAssignmentSummary(roles: number, tasks: number) {
  if (roles === 0 && tasks === 0) return null;
  if (roles === 0)
    return tn("Their 1 task will be left unassigned.", "Their {{count}} tasks will be left unassigned.", tasks);
  if (tasks === 0)
    return tn(
      "Their project role will be left unassigned.",
      "Their {{count}} project roles will be left unassigned.",
      roles,
    );
  if (roles === 1)
    return tn(
      "Their project role and 1 task will be left unassigned.",
      "Their project role and {{count}} tasks will be left unassigned.",
      tasks,
    );
  return tn(
    "Their {{roles}} project roles and 1 task will be left unassigned.",
    "Their {{roles}} project roles and {{count}} tasks will be left unassigned.",
    tasks,
    { roles },
  );
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

function selectBoxOptionStyles({ isFocused, data }: { isFocused: boolean; data: TemplateOption }) {
  const isCreateAction = data.kind === "create";

  return classNames({
    "px-3 py-2 hover:bg-surface-accent cursor-pointer": true,
    "bg-surface-accent": isFocused,
    "text-content-dimmed": data.kind === "none" && !isFocused,
    "sticky bottom-0 z-10 mt-1 border-t border-surface-outline font-medium text-link-base": isCreateAction,
    "bg-surface-base": isCreateAction && !isFocused,
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
