import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const isEditing = annotation !== null;

  const form = useForm<{ date: string; title: string }>({
    fields: {
      date: annotation ? toIsoDate(annotation.date) : toIsoDate(new Date()),
      title: annotation?.title ?? "",
    },
    validate: (addError) => {
      if (!form.values.date) addError("date", t("Choose a date"));
      if (!form.values.title.trim()) addError("title", t("Enter a title"));
    },
    submit: async () => {
      if (!kpi) return;
      setSubmitError(null);

      const result = isEditing
        ? await onEdit({
            id: annotation.id,
            date: form.values.date,
            title: form.values.title.trim(),
          })
        : await onCreate({
            kpiId: kpi.id,
            date: form.values.date,
            title: form.values.title.trim(),
          });

      if (result.success) {
        form.actions.reset();
        onClose();
      } else {
        setSubmitError(result.error ?? t("Something went wrong. Please try again."));
      }
    },
    cancel: onClose,
  });

  React.useEffect(() => {
    if (!isOpen) return;

    form.actions.setValue("date", annotation ? toIsoDate(annotation.date) : toIsoDate(new Date()));
    form.actions.setValue("title", annotation?.title ?? "");
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
        setSubmitError(result.error ?? t("Something went wrong. Please try again."));
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
      title={isEditing ? t("Edit annotation") : t("Add annotation")}
      size="x-small"
      testId="kpi-annotation-modal"
    >
      <Form form={form}>
        <p className="mb-4 text-sm text-content-dimmed">
          {t(
            "Mark a date on this chart with something that happened — a launch, a pricing change, or another event that helps explain the numbers.",
          )}
        </p>

        <div className="space-y-4">
          <DateInput field="date" label={t("Date")} required />
          <TextInput
            field="title"
            label={t("Title")}
            placeholder={t("e.g. Launched enterprise plan")}
            required
            autoFocus
            maxLength={80}
          />
        </div>

        {submitError && (
          <div className="mt-4 text-sm text-content-error" data-test-id="kpi-annotation-error">
            {submitError}
          </div>
        )}

        <Submit saveText={isEditing ? t("Save annotation") : t("Add annotation")} cancelText={t("Cancel")} />
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
            {t("Delete annotation")}
          </DangerButton>
        </div>
      )}
    </Modal>
  );
}
