import { useTranslation } from "react-i18next";
import { useSendTestEmail } from "@/ee/models/emailSettingsLifecycle";
import * as React from "react";

import classNames from "classnames";
import { useBoolState } from "@/hooks/useBoolState";
import { Forms, Modal, SecondaryButton } from "turboui";

interface TestEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function TestEmailModal({ isOpen, onClose }: TestEmailModalProps) {
  const { t } = useTranslation();
  return (
    <Modal title={t("Send Test Email")} isOpen={isOpen} onClose={onClose}>
      <TestEmailForm onClose={onClose} />
    </Modal>
  );
}

export function TestEmailAction() {
  const { t } = useTranslation();
  const [isOpen, , openModal, closeModal] = useBoolState(false);

  return (
    <>
      <SecondaryButton size="sm" onClick={openModal}>
        {t("Send Test Email")}
      </SecondaryButton>
      <TestEmailModal isOpen={isOpen} onClose={closeModal} />
    </>
  );
}

function TestEmailForm({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  const { mutateAsync: sendTestEmail } = useSendTestEmail();
  const [statusMessage, setStatusMessage] = React.useState<string | null>(null);
  const [statusTone, setStatusTone] = React.useState<"success" | "error">("success");

  const form = Forms.useForm({
    fields: {
      recipient: "",
      subject: t("Test email from Operately"),
      body: t("This is a test email to confirm your delivery settings."),
    },
    submit: async () => {
      setStatusMessage(null);

      const recipient = form.values.recipient.trim();
      const subject = form.values.subject.trim();

      const result = await sendTestEmail({
        recipient,
        subject,
        body: form.values.body,
      });

      if (result.success) {
        setStatusTone("success");
        setStatusMessage(t("Test email sent successfully."));
      } else {
        setStatusTone("error");
        setStatusMessage(result.error || t("Failed to send test email."));
      }
    },
    cancel: onClose,
  });

  return (
    <Forms.Form form={form}>
      <Forms.FieldGroup>
        <Forms.TextInput field="recipient" label={t("Recipient")} placeholder={t("recipient@example.com")} />
        <Forms.TextInput field="subject" label={t("Subject")} placeholder={t("Test email")} />
        <TextareaField field="body" label={t("Body")} placeholder={t("Write a short test message")} rows={5} />
      </Forms.FieldGroup>

      {statusMessage && <StatusMessage tone={statusTone}>{statusMessage}</StatusMessage>}

      <Forms.Submit saveText={t("Send Test Email")} cancelText={t("Cancel")} />
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
  const [value, setValue] = Forms.useFieldValue<string>(field);
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
