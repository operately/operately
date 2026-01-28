import * as React from "react";

import * as Paper from "@/components/PaperContainer";
import Forms from "@/components/Forms";
import * as AdminApi from "@/ee/admin_api";
import classNames from "classnames";
import { Spacer } from "@/components/Spacer";
import { Tooltip } from "@/components/Tooltip";
import { IconInfoCircle } from "turboui";

interface Props {
  initialSettings: AdminApi.EmailSettings | null;
}

export function EmailSettingsSection({ initialSettings }: Props) {
  const [emailSettings, setEmailSettings] = React.useState<AdminApi.EmailSettings | null>(initialSettings);

  return (
    <div className="mt-12">
      <Paper.Section
        title="Email Settings"
        subtitle="Configure the email provider used by all companies. Secrets are never displayed; enter a new value to replace them."
      >
        <EmailSettingsForm emailSettings={emailSettings} onUpdate={setEmailSettings} />
      </Paper.Section>
    </div>
  );
}

interface FormProps {
  emailSettings: AdminApi.EmailSettings | null;
  onUpdate: (settings: AdminApi.EmailSettings | null) => void;
}

function EmailSettingsForm({ emailSettings, onUpdate }: FormProps) {
  const [updateEmailSettings] = AdminApi.useUpdateEmailSettings();
  const [statusMessage, setStatusMessage] = React.useState<string | null>(null);
  const [statusTone, setStatusTone] = React.useState<"success" | "error">("success");

  const initialProvider: AdminApi.EmailProvider = emailSettings?.provider ?? "smtp";
  const initialSmtp = emailSettings?.smtp;
  const initialNotificationEmail = emailSettings?.notificationEmail ?? "";

  const form = Forms.useForm({
    fields: {
      provider: initialProvider,
      notificationEmail: initialNotificationEmail,
      smtpHost: initialSmtp?.host ?? "",
      smtpPort: initialSmtp?.port?.toString() ?? "",
      smtpUsername: initialSmtp?.username ?? "",
      smtpPassword: "",
      smtpSsl: initialSmtp?.ssl ?? false,
      smtpTlsRequired: initialSmtp?.tlsRequired ?? false,
      sendgridApiKey: "",
    },
    submit: async () => {
      setStatusMessage(null);

      const smtpPort = parsePort(form.values.smtpPort);
      const sendgridApiKey = normalizeSecret(form.values.sendgridApiKey);
      const smtpPassword = normalizeSecret(form.values.smtpPassword);

      const result = await updateEmailSettings({
        provider: form.values.provider,
        notificationEmail: normalizeOptional(form.values.notificationEmail),
        smtpHost: form.values.smtpHost,
        smtpPort,
        smtpUsername: form.values.smtpUsername,
        smtpPassword,
        smtpSsl: form.values.smtpSsl,
        smtpTlsRequired: form.values.smtpTlsRequired,
        sendgridApiKey,
      });

      if (result.success) {
        setStatusTone("success");
        setStatusMessage("Email settings saved.");
        form.actions.setValue("sendgridApiKey", "");
        form.actions.setValue("smtpPassword", "");
        onUpdate(result.emailSettings ?? null);
      } else {
        setStatusTone("error");
        setStatusMessage(result.error || "Failed to save email settings.");
      }
    },
  });

  const sendgridKeySet = emailSettings?.sendgridApiKeySet ?? false;
  const smtpPasswordSet = emailSettings?.smtp?.smtpPasswordSet ?? false;

  return (
    <Forms.Form form={form}>
      <Forms.FieldGroup>
        <Forms.TextInput
          field="notificationEmail"
          label="Notification Email"
          placeholder="noreply@yourcompany.com"
        />
        <Forms.RadioButtons
          field="provider"
          label="Provider"
          options={[
            { value: "smtp", label: "SMTP" },
            { value: "sendgrid", label: "SendGrid" },
          ]}
        />
      </Forms.FieldGroup>

      <Spacer size={2} />

      {form.values.provider === "sendgrid" && (
        <Forms.FieldGroup>
          <SecretPasswordInput
            field="sendgridApiKey"
            label="SendGrid API Key"
            isSet={sendgridKeySet}
            placeholder="Enter API key"
          />
        </Forms.FieldGroup>
      )}

      {form.values.provider === "smtp" && (
        <Forms.FieldGroup layout="grid" layoutOptions={{ columns: 2 }}>
          <Forms.TextInput field="smtpHost" label="SMTP Host" placeholder="smtp.example.com" />
          <Forms.NumberInput field="smtpPort" label="SMTP Port" placeholder="587" />
          <Forms.TextInput field="smtpUsername" label="SMTP Username" placeholder="user@example.com" />
          <SmtpPasswordInput isSet={smtpPasswordSet} />
          <div className="col-span-2 space-y-2">
            <BooleanCheckbox field="smtpSsl" label="Use SSL" />
            <BooleanCheckbox field="smtpTlsRequired" label="Require TLS" />
          </div>
        </Forms.FieldGroup>
      )}

      {statusMessage && <StatusMessage tone={statusTone}>{statusMessage}</StatusMessage>}

      <Forms.Submit saveText="Save Email Settings" />
    </Forms.Form>
  );
}

function SecretPasswordInput({
  field,
  label,
  isSet,
  placeholder,
}: {
  field: string;
  label: string;
  isSet: boolean;
  placeholder: string;
}) {
  const [value, setValue] = Forms.useFieldValue<string>(field);
  const error = Forms.useFieldError(field);
  const [isFocused, setIsFocused] = React.useState(false);

  const helperText = <div className="text-xs text-content-dimmed">{label} already set. Leave blank to keep the current value</div>
  const placeholderValue = isSet && !isFocused && value === "" ? "••••••••" : placeholder;

  const labelNode = (
    <span className="inline-flex items-center gap-2">
      <span>{label}</span>
      <Tooltip content={helperText}>
        <span className="inline-flex items-center cursor-help">
          <IconInfoCircle size={14} className="text-content-dimmed hover:text-content-accent" />
        </span>
      </Tooltip>
    </span>
  );

  return (
    <Forms.InputField field={field} label={labelNode} error={error}>
      <div className="relative pb-5">
        <input
          name={field}
          type="password"
          className={passwordStyles(!!error)}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholderValue}
          onFocus={() => {
            setIsFocused(true);
            if (isSet && value === "") {
              setValue("");
            }
          }}
          onBlur={() => setIsFocused(false)}
        />
      </div>
    </Forms.InputField>
  );
}

function SmtpPasswordInput({ isSet }: { isSet: boolean }) {
  const field = "smtpPassword";
  const [value, setValue] = Forms.useFieldValue<string>(field);
  const error = Forms.useFieldError(field);
  const [isFocused, setIsFocused] = React.useState(false);

  const helperText = (
    <div className="text-xs text-content-dimmed">Password already set. Leave blank to keep current password</div>
  );
  const placeholder = isSet && !isFocused && value === "" ? "••••••••" : "Enter password";

  const labelNode = (
    <span className="inline-flex items-center gap-2">
      <span>SMTP Password</span>
      <Tooltip content={helperText}>
        <span className="inline-flex items-center">
          <IconInfoCircle size={14} className="text-content-dimmed hover:text-content-accent" />
        </span>
      </Tooltip>
    </span>
  );

  return (
    <Forms.InputField field={field} label={labelNode} error={error}>
      <div className="relative pb-5">
        <input
          name={field}
          className={passwordStyles(!!error)}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          onFocus={() => {
            setIsFocused(true);
            if (isSet && value === "") {
              setValue("");
            }
          }}
          onBlur={() => setIsFocused(false)}
        />
      </div>
    </Forms.InputField>
  );
}

function StatusMessage({ tone, children }: { tone: "success" | "error"; children: React.ReactNode }) {
  const className = classNames("mt-4 text-sm", {
    "text-green-600": tone === "success",
    "text-red-500": tone === "error",
  });

  return <div className={className}>{children}</div>;
}

function BooleanCheckbox({ field, label }: { field: string; label: string }) {
  const [value, setValue] = Forms.useFieldValue<boolean>(field);

  return (
    <Forms.InputField field={field} label={label}>
      <label className="flex items-center gap-2 text-sm text-content-accent">
        <input
          type="checkbox"
          checked={!!value}
          onChange={(e) => setValue(e.target.checked)}
          className="h-4 w-4 border border-surface-outline"
        />
        <span>{label}</span>
      </label>
    </Forms.InputField>
  );
}

function passwordStyles(error: boolean | undefined) {
  return classNames({
    "w-full": true,
    "bg-surface-base text-content-accent placeholder-content-subtle": true,
    "border rounded-lg": true,
    "px-3 py-1.5": true,
    "border-surface-outline": !error,
    "border-red-500": error,
  });
}

function parsePort(value: string) {
  if (!value) return undefined;
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? undefined : parsed;
}

function normalizeSecret(value: string) {
  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
}

function normalizeOptional(value: string) {
  const trimmed = value.trim();
  return trimmed === "" ? undefined : trimmed;
}
