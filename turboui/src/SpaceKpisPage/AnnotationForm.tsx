import React from "react";

import { DangerButton } from "../Button";
import { DateInput, Form, Submit, TextInput, useForm } from "../Forms";
import { Modal } from "../Modal";
import type { SpaceKpisPage } from "./types";
import { toIsoDate } from "./utils";

interface AnnotationFormProps {
  kpi: SpaceKpisPage.Kpi | null;
  annotation: SpaceKpisPage.KpiAnnotation | null;
  isOpen: boolean;
  onClose: () => void;
  onCreate: (input: SpaceKpisPage.AnnotationInput) => Promise<SpaceKpisPage.MutationResult>;
  onEdit: (input: SpaceKpisPage.EditAnnotationInput) => Promise<SpaceKpisPage.MutationResult>;
  onDelete: (annotationId: string) => Promise<SpaceKpisPage.MutationResult>;
}

export function AnnotationForm({ kpi, annotation, isOpen, onClose, onCreate, onEdit, onDelete }: AnnotationFormProps) {
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const isEditing = annotation !== null;

  const form = useForm<{ date: string; title: string; description: string }>({
    fields: {
      date: annotation ? toIsoDate(annotation.date) : toIsoDate(new Date()),
      title: annotation?.title ?? "",
      description: annotation?.description ?? "",
    },
    validate: (addError) => {
      if (!form.values.date) addError("date", "Choose a date");
      if (!form.values.title.trim()) addError("title", "Enter a title");
    },
    submit: async () => {
      if (!kpi) return;
      setSubmitError(null);

      const description = form.values.description.trim();
      const result = isEditing
        ? await onEdit({
            id: annotation.id,
            date: form.values.date,
            title: form.values.title.trim(),
            description,
          })
        : await onCreate({
            kpiId: kpi.id,
            date: form.values.date,
            title: form.values.title.trim(),
            description,
          });

      if (result.success) {
        form.actions.reset();
        onClose();
      } else {
        setSubmitError(result.error ?? "Something went wrong. Please try again.");
      }
    },
    cancel: onClose,
  });

  React.useEffect(() => {
    if (!isOpen) return;

    form.actions.setValue("date", annotation ? toIsoDate(annotation.date) : toIsoDate(new Date()));
    form.actions.setValue("title", annotation?.title ?? "");
    form.actions.setValue("description", annotation?.description ?? "");
    setSubmitError(null);
    setIsDeleting(false);
    // form.actions is a stable imperative handle; including it would retrigger this fill.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [annotation, isOpen]);

  const handleDelete = async () => {
    if (!annotation) return;
    setSubmitError(null);
    setIsDeleting(true);

    try {
      const result = await onDelete(annotation.id);
      if (result.success) {
        form.actions.reset();
        onClose();
      } else {
        setSubmitError(result.error ?? "Something went wrong. Please try again.");
      }
    } finally {
      setIsDeleting(false);
    }
  };

  if (!kpi) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? "Edit annotation" : "Add annotation"}
      size="x-small"
      testId="kpi-annotation-modal"
    >
      <Form form={form}>
        <p className="mb-4 text-sm text-content-dimmed">
          Mark a date on this chart with something that happened — a launch, a pricing change, or another event that
          helps explain the numbers.
        </p>

        <div className="space-y-4">
          <DateInput field="date" label="Date" required />
          <TextInput
            field="title"
            label="Title"
            placeholder="e.g. Launched enterprise plan"
            required
            autoFocus
            maxLength={80}
          />
          <TextInput
            field="description"
            label="Note (optional)"
            placeholder="What changed, and why it matters"
            maxLength={500}
          />
        </div>

        {submitError && (
          <div className="mt-4 text-sm text-content-error" data-test-id="kpi-annotation-error">
            {submitError}
          </div>
        )}

        <Submit saveText={isEditing ? "Save annotation" : "Add annotation"} cancelText="Cancel" />
      </Form>

      {isEditing && (
        <div className="mt-2 border-t border-stroke-base pt-4">
          <DangerButton
            size="sm"
            onClick={handleDelete}
            loading={isDeleting}
            disabled={isDeleting}
            testId="delete-kpi-annotation"
          >
            Delete annotation
          </DangerButton>
        </div>
      )}
    </Modal>
  );
}
