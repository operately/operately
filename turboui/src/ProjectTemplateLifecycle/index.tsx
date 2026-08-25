import React from "react";
import { PrimaryButton, SecondaryButton } from "../Button";
import { ConfirmDialog } from "../ConfirmDialog";
import * as Forms from "../Forms";
import Modal from "../Modal";
import { IconArchive, IconRotate, IconTrash } from "../icons";
import { showSuccessToast } from "../Toasts";

export type ProjectTemplateLifecycleAction = "duplicate" | "archive" | "restore" | "delete";

export namespace ProjectTemplateLifecycle {
  export interface Template {
    id: string;
    name: string;
  }

  export interface MutationResult {
    success: boolean;
    error?: string;
  }

  export interface Handlers {
    onDuplicate: (id: string, name: string) => Promise<MutationResult>;
    onArchive: (id: string) => Promise<MutationResult>;
    onRestore: (id: string) => Promise<MutationResult>;
    onDelete: (id: string) => Promise<MutationResult>;
  }

  export interface Props extends Handlers {
    action: ProjectTemplateLifecycleAction | null;
    template: Template | null;
    onClose: () => void;
  }
}

export function ProjectTemplateLifecycleDialogs(props: ProjectTemplateLifecycle.Props) {
  const template = props.template;
  const action = props.action;
  if (!template || !action) return null;

  if (action === "duplicate") {
    return <DuplicateTemplateModal {...props} template={template} />;
  }

  const copy = confirmationCopy(action, template.name);

  return (
    <LifecycleConfirmDialog
      {...copy}
      action={action}
      testId={`${action}-project-template-dialog`}
      onCancel={props.onClose}
      onConfirm={() => lifecycleHandler(props, action)(template.id)}
      onSuccess={props.onClose}
    />
  );
}

function DuplicateTemplateModal(
  props: ProjectTemplateLifecycle.Props & { template: ProjectTemplateLifecycle.Template },
) {
  const form = Forms.useForm({
    fields: { name: `Copy of ${props.template.name}` },
    submit: async () => {
      const result = await props.onDuplicate(props.template.id, form.values.name.trim());
      if (!result.success) throw new Error(result.error ?? "The template could not be duplicated. Try again.");
      notifyLifecycleSuccess("duplicate");
      props.onClose();
    },
    cancel: props.onClose,
    onError: (error) =>
      form.actions.addErrors({
        form: error instanceof Error ? error.message : "The template could not be duplicated. Try again.",
      }),
  });

  return (
    <Modal isOpen onClose={() => void form.actions.cancel()} title="Duplicate project template" size="medium">
      <Forms.Form form={form} className="space-y-5" testId="duplicate-project-template-form">
        <Forms.TextInput field="name" label="Template name" required autoFocus />
        <Forms.FormError message={form.errors.form} />
        <div className="flex justify-end gap-3">
          <SecondaryButton type="button" onClick={() => void form.actions.cancel()} disabled={form.state !== "idle"}>
            Cancel
          </SecondaryButton>
          <PrimaryButton type="submit" loading={form.state === "submitting"} testId="duplicate-project-template">
            Duplicate template
          </PrimaryButton>
        </div>
      </Forms.Form>
    </Modal>
  );
}

function LifecycleConfirmDialog({
  action,
  onConfirm,
  onSuccess,
  ...props
}: Omit<React.ComponentProps<typeof ConfirmDialog>, "isOpen" | "onConfirm"> & {
  action: Exclude<ProjectTemplateLifecycleAction, "duplicate">;
  onConfirm: () => Promise<ProjectTemplateLifecycle.MutationResult>;
  onSuccess: () => void;
}) {
  const [confirming, setConfirming] = React.useState(false);

  async function confirm() {
    setConfirming(true);
    try {
      const result = await onConfirm();
      if (result.success) {
        notifyLifecycleSuccess(action);
        onSuccess();
      }
    } finally {
      setConfirming(false);
    }
  }

  return <ConfirmDialog {...props} isOpen onConfirm={() => void confirm()} confirming={confirming} />;
}

function notifyLifecycleSuccess(action: ProjectTemplateLifecycleAction) {
  const message = successToast(action);
  if (message) showSuccessToast(message.title, message.description);
}

function successToast(action: ProjectTemplateLifecycleAction) {
  if (action === "duplicate") {
    return { title: "Template duplicated", description: "You're now editing the copy." };
  }

  if (action === "archive") {
    return { title: "Template archived", description: "It can be restored later." };
  }

  return null;
}

function lifecycleHandler(
  props: ProjectTemplateLifecycle.Props,
  action: Exclude<ProjectTemplateLifecycleAction, "duplicate">,
) {
  if (action === "archive") return props.onArchive;
  if (action === "restore") return props.onRestore;
  return props.onDelete;
}

function confirmationCopy(action: Exclude<ProjectTemplateLifecycleAction, "duplicate">, name: string) {
  if (action === "archive") {
    return {
      title: `Archive “${name}”?`,
      message: "This template will leave project creation and can be restored later.",
      confirmText: "Archive template",
      cancelText: "Keep active",
      icon: IconArchive,
    };
  }

  if (action === "restore") {
    return {
      title: `Restore “${name}”?`,
      message: "This template will return to active use and project creation.",
      confirmText: "Restore template",
      cancelText: "Keep archived",
      icon: IconRotate,
    };
  }

  return {
    title: `Delete “${name}”?`,
    message: "This template will be permanently removed. Existing projects created from it will remain unchanged.",
    confirmText: "Delete template",
    cancelText: "Keep template",
    variant: "danger" as const,
    icon: IconTrash,
  };
}
