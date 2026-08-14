import React from "react";

import { PrimaryButton, SecondaryButton } from "../Button";
import { FormattedTime, type FormattedTimePreferences } from "../FormattedTime";
import * as Forms from "../Forms";
import { IconInfoCircle } from "../icons";
import { Link } from "../Link";
import { Modal } from "../Modal";
import type { RichEditorHandlers } from "../RichEditor/useEditor";
import { SwitchToggle } from "../SwitchToggle";
import { Tooltip } from "../Tooltip";

export namespace SaveProjectAsTemplateModal {
  export type ResourceType = "project" | "milestone" | "task";
  export type ScheduleField = "start_date" | "end_date" | "due_date";
  export type ScheduleReason = "missing" | "before_project_start";

  export interface ScheduleIssue {
    resourceType: ResourceType;
    resourceId: string;
    resourceName: string;
    field: ScheduleField;
    date: string | null;
    reason: ScheduleReason;
    link: string;
  }

  export interface Values extends Forms.FormValues {
    name: string;
    description: unknown;
    includePeopleAndAssignments: boolean;
    includeDiscussions: boolean;
    includeComments: boolean;
    includeDocsAndFiles: boolean;
  }

  export interface Result {
    success: boolean;
    scheduleIssues?: ScheduleIssue[];
    error?: string;
  }

  export interface Props {
    isOpen: boolean;
    onClose: () => void;
    projectName: string;
    projectDescription: unknown;
    richTextHandlers: RichEditorHandlers;
    formattedTimePreferences: FormattedTimePreferences;
    submissionEnabled: boolean;
    onSave: (values: Values) => Promise<Result>;
    onSuccess?: () => void;
  }
}

export function SaveProjectAsTemplateModal(props: SaveProjectAsTemplateModal.Props) {
  const [scheduleIssues, setScheduleIssues] = React.useState<SaveProjectAsTemplateModal.ScheduleIssue[]>([]);
  const form = Forms.useForm<SaveProjectAsTemplateModal.Values>({
    fields: initialValues(props),
    submit: async () => {
      setScheduleIssues([]);
      const result = await props.onSave(form.values);

      if (result.scheduleIssues?.length) {
        setScheduleIssues(result.scheduleIssues);
        return;
      }

      if (!result.success) {
        throw new Error(result.error ?? "The template could not be created. Check the project and try again.");
      }

      form.actions.reset();
      props.onClose();
      props.onSuccess?.();
    },
    cancel: () => {
      setScheduleIssues([]);
      props.onClose();
    },
    onError: (error) =>
      form.actions.addErrors({
        form:
          error instanceof Error
            ? error.message
            : "The template could not be created. Check the project and try again.",
      }),
  });

  React.useEffect(() => {
    if (props.isOpen) {
      form.actions.reset();
      setScheduleIssues([]);
    }
  }, [props.isOpen]);

  return (
    <Modal
      isOpen={props.isOpen}
      onClose={() => void form.actions.cancel()}
      title="Save project as template"
      size="large"
    >
      <Forms.Form form={form} className="space-y-5" testId="save-project-as-template-form">
        <Forms.TextInput field="name" label="Template name" required autoFocus />
        <Forms.RichTextArea
          field="description"
          label="Description"
          richTextHandlers={props.richTextHandlers}
          height="min-h-[140px]"
        />

        <div className="space-y-4 rounded-lg border border-surface-outline p-4">
          <h3 className="flex items-center gap-2 font-semibold text-content-accent">
            <span>Include</span>
            <Tooltip
              content={
                <div className="max-w-xs">
                  <div className="font-semibold mb-2">Include in template</div>
                  <div className="text-sm">Choose which parts of this project to copy into the template.</div>
                </div>
              }
            >
              <IconInfoCircle className="w-4 h-4 text-content-dimmed cursor-help" />
            </Tooltip>
          </h3>
          <IncludeSwitch
            form={form}
            field="includePeopleAndAssignments"
            label="People and assignments"
            helperText="Copies the project team with their roles and access."
          />
          <IncludeSwitch form={form} field="includeDiscussions" label="Discussions" />
          <IncludeSwitch form={form} field="includeComments" label="Comments" />
          <IncludeSwitch form={form} field="includeDocsAndFiles" label="Docs & Files" />
        </div>

        {scheduleIssues.length > 0 && (
          <ScheduleIssues issues={scheduleIssues} formattedTimePreferences={props.formattedTimePreferences} />
        )}
        <Forms.FormError message={form.errors.form} />

        <div className="flex justify-end gap-3">
          <SecondaryButton type="button" onClick={() => void form.actions.cancel()} disabled={form.state !== "idle"}>
            Cancel
          </SecondaryButton>
          <PrimaryButton
            type="submit"
            loading={form.state === "submitting"}
            disabled={!props.submissionEnabled}
            testId="save-project-as-template"
          >
            Save as template
          </PrimaryButton>
        </div>
      </Forms.Form>
    </Modal>
  );
}

function IncludeSwitch({
  form,
  field,
  label,
  helperText,
}: {
  form: Forms.FormState<SaveProjectAsTemplateModal.Values>;
  field: "includePeopleAndAssignments" | "includeDiscussions" | "includeComments" | "includeDocsAndFiles";
  label: string;
  helperText?: string;
}) {
  const value = Boolean(form.values[field]);
  return (
    <div className="space-y-1">
      <SwitchToggle label={label} value={value} setValue={(next) => form.actions.setValue(field, next)} />
      {helperText && <p className="ml-14 text-xs leading-snug text-content-dimmed">{helperText}</p>}
    </div>
  );
}

function ScheduleIssues({
  issues,
  formattedTimePreferences,
}: {
  issues: SaveProjectAsTemplateModal.ScheduleIssue[];
  formattedTimePreferences: FormattedTimePreferences;
}) {
  return (
    <div className="rounded-lg border border-callout-error-content bg-callout-error-bg p-4" role="alert">
      <p className="font-semibold text-content-error">Some dates are before the project start date.</p>
      <p className="mt-1 text-sm text-content-base">Change or remove these dates, then try again.</p>
      <ul className="mt-3 list-disc space-y-1 pl-5 text-sm">
        {issues.map((issue) => (
          <li key={`${issue.resourceType}-${issue.resourceId}-${issue.field}`}>
            <Link to={issue.link}>{issue.resourceName}</Link>
            {issue.date && (
              <>
                {": "}
                <FormattedTime time={issue.date} format="long-date" {...formattedTimePreferences} />
              </>
            )}
            {!issue.date && ": Project start date is missing"}
          </li>
        ))}
      </ul>
    </div>
  );
}

function initialValues(props: SaveProjectAsTemplateModal.Props): SaveProjectAsTemplateModal.Values {
  return {
    name: props.projectName,
    description: props.projectDescription,
    includePeopleAndAssignments: false,
    includeDiscussions: true,
    includeComments: false,
    includeDocsAndFiles: true,
  };
}
