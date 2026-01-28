import * as React from "react";

import Forms from "@/components/Forms";
import classNames from "classnames";
import * as AdminApi from "@/ee/admin_api";
import Modal from "@/components/Modal";
import { useBoolState } from "@/hooks/useBoolState";
import { SecondaryButton } from "turboui";

interface TestEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TestEmailModal({ isOpen, onClose }: TestEmailModalProps) {
  return (
    <Modal title="Send Test Email" isOpen={isOpen} hideModal={onClose}>
      <TestEmailForm onClose={onClose} />
    </Modal>
  );
}

export function TestEmailAction() {
  const [isOpen, , openModal, closeModal] = useBoolState(false);

  return (
    <>
      <SecondaryButton size="sm" onClick={openModal}>
        Send Test Email
      </SecondaryButton>
      <TestEmailModal isOpen={isOpen} onClose={closeModal} />
    </>
  );
}

function TestEmailForm({ onClose }: { onClose: () => void }) {
  const [sendTestEmail] = AdminApi.useSendTestEmail();
  const [statusMessage, setStatusMessage] = React.useState<string | null>(null);
  const [statusTone, setStatusTone] = React.useState<"success" | "error">("success");

  const form = Forms.useForm({
    fields: {
      recipient: "",
      subject: "Test email from Operately",
      body: "This is a test email to confirm your delivery settings.",
    },
    submit: async () => {
      setStatusMessage(null);

      const result = await sendTestEmail({
        recipient: form.values.recipient,
        subject: form.values.subject,
        body: form.values.body,
      });

      if (result.success) {
        setStatusTone("success");
        setStatusMessage("Test email sent successfully.");
      } else {
        setStatusTone("error");
        setStatusMessage(result.error || "Failed to send test email.");
      }
    },
    cancel: onClose,
  });

  return (
    <Forms.Form form={form}>
      <Forms.FieldGroup>
        <Forms.TextInput field="recipient" label="Recipient" placeholder="recipient@example.com" />
        <Forms.TextInput field="subject" label="Subject" placeholder="Test email" />
        <TextareaField field="body" label="Body" placeholder="Write a short test message" rows={5} />
      </Forms.FieldGroup>

      {statusMessage && <StatusMessage tone={statusTone}>{statusMessage}</StatusMessage>}

      <Forms.Submit saveText="Send Test Email" cancelText="Cancel" />
    </Forms.Form>
  );
}

function StatusMessage({ tone, children }: { tone: "success" | "error"; children: React.ReactNode }) {
  const className = classNames("mt-4 text-sm", {
    "text-green-600": tone === "success",
    "text-red-500": tone === "error",
  });

  return <div className={className}>{children}</div>;
}

function TextareaField({
  field,
  label,
  placeholder,
  rows = 4,
}: {
  field: string;
  label: string;
  placeholder?: string;
  rows?: number;
}) {
  const [value, setValue] = Forms.useFieldValue(field);
  const error = Forms.useFieldError(field);

  return (
    <Forms.InputField field={field} label={label} error={error}>
      <textarea
        className={classNames(
          "w-full bg-surface-base text-content-accent placeholder-content-subtle border rounded-lg px-3 py-2",
          {
            "border-red-500": !!error,
            "border-surface-outline": !error,
          },
        )}
        rows={rows}
        placeholder={placeholder}
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
    </Forms.InputField>
  );
}
