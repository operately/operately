import * as AdminApi from "@/ee/admin_api";
import * as React from "react";

import Forms from "@/components/Forms";
import Modal from "@/components/Modal";
import { formatStorageBytes } from "turboui";

interface PlanDefinitionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  planDefinition?: AdminApi.BillingPlanDefinition;
}

type LimitMode = "limited" | "unlimited";

export function PlanDefinitionModal({ isOpen, onClose, onSuccess, planDefinition }: PlanDefinitionModalProps) {
  const [update] = AdminApi.useUpdateBillingPlanDefinition();

  if (!planDefinition) return null;

  const form = Forms.useForm({
    fields: {
      displayName: planDefinition.displayName,
      sortOrder: String(planDefinition.sortOrder),
      memberLimitMode: limitModeFromValue(planDefinition.memberLimit),
      memberLimit: limitInputValue(planDefinition.memberLimit),
      storageLimitMode: limitModeFromValue(planDefinition.storageLimitBytes),
      storageLimitBytes: limitInputValue(planDefinition.storageLimitBytes),
    },
    validate: (addError) => {
      validatePositiveInteger(addError, "sortOrder", form.values.sortOrder, "Sort order must be 0 or greater", { allowZero: true });

      if (form.values.memberLimitMode === "limited") {
        validatePositiveInteger(addError, "memberLimit", form.values.memberLimit, "Member limit must be greater than 0");
      }

      if (form.values.storageLimitMode === "limited") {
        validatePositiveInteger(addError, "storageLimitBytes", form.values.storageLimitBytes, "Storage limit must be greater than 0");
      }
    },
    cancel: onClose,
    submit: async () => {
      const result = await update({
        id: planDefinition.id,
        displayName: form.values.displayName,
        sortOrder: parseInt(form.values.sortOrder, 10),
        memberLimit: parseNullableLimit(form.values.memberLimitMode, form.values.memberLimit),
        storageLimitBytes: parseNullableLimit(form.values.storageLimitMode, form.values.storageLimitBytes),
      });

      if (result && result.planDefinition) {
        form.actions.reset();
        onClose();
        onSuccess();
      }
    },
  });

  return (
    <Modal title="Edit plan definition" isOpen={isOpen} hideModal={onClose}>
      <Forms.Form form={form}>
        <Forms.FieldGroup layout="vertical">
          <ReadOnlyField label="Plan key" value={planDefinition.key} />
          <Forms.TextInput label="Display Name" field="displayName" required autoFocus />
          <Forms.NumberInput label="Sort order" field="sortOrder" required />
          <Forms.SelectBox
            label="Member limit"
            field="memberLimitMode"
            options={[
              { value: "limited", label: "Limited" },
              { value: "unlimited", label: "Unlimited" },
            ]}
            required
          />
          {form.values.memberLimitMode === "limited" && <Forms.NumberInput label="Member limit value" field="memberLimit" />}
          <Forms.SelectBox
            label="Storage limit"
            field="storageLimitMode"
            options={[
              { value: "limited", label: "Limited" },
              { value: "unlimited", label: "Unlimited" },
            ]}
            required
          />
          {form.values.storageLimitMode === "limited" && (
            <div className="flex flex-col gap-1">
              <Forms.NumberInput label="Storage limit bytes" field="storageLimitBytes" />
              <StorageLimitPreview value={form.values.storageLimitBytes} />
            </div>
          )}
        </Forms.FieldGroup>
        <Forms.Submit saveText="Save changes" cancelText="Cancel" />
      </Forms.Form>
    </Modal>
  );
}

function ReadOnlyField({ label, value }: { label: string; value: string }) {
  return (
    <Forms.InputField field={label.toLowerCase().replace(/\s+/g, "-")} label={label}>
      <div className="w-full rounded-lg border border-surface-outline bg-surface-dimmed px-3 py-2 text-content-accent">
        {value}
      </div>
    </Forms.InputField>
  );
}

function StorageLimitPreview({ value }: { value: string }) {
  const parsed = Number.parseInt(value, 10);

  if (!Number.isInteger(parsed) || parsed <= 0) return null;

  return <div className="text-xs text-content-dimmed">Preview: {formatStorageBytes(parsed)}</div>;
}

function limitModeFromValue(value?: number | null): LimitMode {
  return value == null ? "unlimited" : "limited";
}

function limitInputValue(value?: number | null): string {
  return value == null ? "" : String(value);
}

function parseNullableLimit(mode: LimitMode, value: string): number | null {
  if (mode === "unlimited") return null;
  return parseInt(value, 10);
}

function validatePositiveInteger(
  addError: (field: string, message: string) => void,
  field: string,
  value: string,
  message: string,
  opts?: { allowZero?: boolean },
) {
  const parsed = Number.parseInt(value, 10);
  const minimum = opts?.allowZero ? 0 : 1;

  if (!Number.isInteger(parsed) || parsed < minimum) {
    addError(field, message);
  }
}
