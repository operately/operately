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
  const [create] = AdminApi.useCreateBillingPlanDefinition();
  const [update] = AdminApi.useUpdateBillingPlanDefinition();
  const isEdit = planDefinition !== undefined;

  const form = Forms.useForm({
    fields: {
      planKey: planDefinition?.key ?? "",
      displayName: planDefinition?.displayName ?? "",
      tierRank: planDefinition ? String(planDefinition.tierRank) : "",
      billingBehavior: planDefinition?.billingBehavior ?? "provider_managed",
      customerSelectable: String(planDefinition?.customerSelectable ?? false),
      memberLimitMode: limitModeFromValue(planDefinition?.memberLimit),
      memberLimit: limitInputValue(planDefinition?.memberLimit),
      storageLimitMode: limitModeFromValue(planDefinition?.storageLimitBytes),
      storageLimitBytes: limitInputValue(planDefinition?.storageLimitBytes),
    },
    validate: (addError) => {
      if (!isEdit && form.values.planKey.trim().length === 0) {
        addError("planKey", "Plan key is required");
      }

      validatePositiveInteger(addError, "tierRank", form.values.tierRank, "Tier rank must be 0 or greater", {
        allowZero: true,
      });

      if (form.values.memberLimitMode === "limited") {
        validatePositiveInteger(
          addError,
          "memberLimit",
          form.values.memberLimit,
          "Member limit must be greater than 0",
        );
      }

      if (form.values.storageLimitMode === "limited") {
        validatePositiveInteger(
          addError,
          "storageLimitBytes",
          form.values.storageLimitBytes,
          "Storage limit must be greater than 0",
        );
      }
    },
    cancel: onClose,
    submit: async () => {
      const attrs = {
        displayName: form.values.displayName,
        tierRank: parseInt(form.values.tierRank, 10),
        billingBehavior: form.values.billingBehavior as AdminApi.BillingBehavior,
        customerSelectable: customerSelectableValue(form.values),
        memberLimit: parseNullableLimit(form.values.memberLimitMode, form.values.memberLimit),
        storageLimitBytes: parseNullableLimit(form.values.storageLimitMode, form.values.storageLimitBytes),
      };
      const result = isEdit
        ? await update({
            id: planDefinition.id,
            ...attrs,
          })
        : await create({
            planKey: form.values.planKey,
            ...attrs,
          });

      if (result && result.planDefinition) {
        form.actions.reset();
        onClose();
        onSuccess();
      }
    },
  });

  React.useEffect(() => {
    if (form.values.billingBehavior === "internal" && form.values.customerSelectable !== "false") {
      form.actions.setValue("customerSelectable", "false");
    }
  }, [form.actions, form.values.billingBehavior, form.values.customerSelectable]);

  return (
    <Modal title={isEdit ? "Edit plan definition" : "Create plan definition"} isOpen={isOpen} hideModal={onClose}>
      <Forms.Form form={form}>
        <Forms.FieldGroup layout="vertical">
          {isEdit ? (
            <ReadOnlyField label="Plan key" value={planDefinition.key} />
          ) : (
            <Forms.TextInput label="Plan key" field="planKey" required autoFocus />
          )}
          <Forms.TextInput label="Display Name" field="displayName" required />
          <Forms.NumberInput label="Tier rank" field="tierRank" required />
          <Forms.SelectBox
            label="Billing behavior"
            field="billingBehavior"
            options={[
              { value: "provider_managed", label: "Provider managed" },
              { value: "internal", label: "Internal" },
            ]}
            required
          />
          {form.values.billingBehavior === "internal" ? (
            <ReadOnlyField label="Customer selectable" value="No" />
          ) : (
            <Forms.SelectBox
              label="Customer selectable"
              field="customerSelectable"
              options={[
                { value: "false", label: "No" },
                { value: "true", label: "Yes" },
              ]}
              required
            />
          )}
          <Forms.SelectBox
            label="Member limit"
            field="memberLimitMode"
            options={[
              { value: "limited", label: "Limited" },
              { value: "unlimited", label: "Unlimited" },
            ]}
            required
          />
          {form.values.memberLimitMode === "limited" && (
            <Forms.NumberInput label="Member limit value" field="memberLimit" />
          )}
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
        <Forms.Submit saveText={isEdit ? "Save changes" : "Create plan"} cancelText="Cancel" />
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

function customerSelectableValue(values: { billingBehavior: string; customerSelectable: string }) {
  if (values.billingBehavior === "internal") return false;
  return values.customerSelectable === "true";
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
