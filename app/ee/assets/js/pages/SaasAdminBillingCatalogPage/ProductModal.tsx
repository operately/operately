import { useTranslation } from "react-i18next";
import i18n from "@/i18n";
import { useCreateBillingProduct, useUpdateBillingProduct } from "@/ee/models/billingCatalogLifecycle";
import * as AdminApi from "@/ee/admin_api";
import * as React from "react";

import { Forms, Modal } from "turboui";

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  product?: AdminApi.BillingProduct;
  planDefinitions: AdminApi.BillingPlanDefinition[];
}

export function ProductModal({ isOpen, onClose, onSuccess, product, planDefinitions }: ProductModalProps) {
  const { t } = useTranslation();
  const { mutateAsync: create } = useCreateBillingProduct();
  const { mutateAsync: update } = useUpdateBillingProduct();
  const isEdit = product !== undefined;
  const availablePlanDefinitions = planDefinitions
    .filter((planDefinition) => planDefinition.billingBehavior === "provider_managed" && !planDefinition.archivedAt)
    .sort((a, b) => a.tierRank - b.tierRank || a.displayName.localeCompare(b.displayName));
  const defaultPlanFamily = availablePlanDefinitions[0]?.key ?? "";

  const form = Forms.useForm({
    fields: {
      displayName: product?.polarProductName ?? "",
      planFamily: product?.planFamily ?? defaultPlanFamily,
      billingInterval: product?.billingInterval ?? "monthly",
      unitAmount: product?.priceAmount ? String(product.priceAmount) : "",
    },
    validate: (addError) => {
      if (!isEdit && !form.values.planFamily) {
        addError("planFamily", t("Create or unarchive a provider-managed plan first"));
      }
    },
    cancel: onClose,
    submit: async () => {
      if (isEdit) {
        const result = await update({
          id: product.id,
          polarProductName: form.values.displayName,
          priceAmount: parseInt(form.values.unitAmount, 10),
          priceCurrency: "usd",
        });

        if (result && result.product) {
          form.actions.reset();
          onClose();
          onSuccess();
        }
      } else {
        const result = await create({
          planFamily: form.values.planFamily,
          billingInterval: form.values.billingInterval,
          polarProductName: form.values.displayName,
          priceAmount: parseInt(form.values.unitAmount, 10),
          priceCurrency: "usd",
        });

        if (result && result.product) {
          form.actions.reset();
          onClose();
          onSuccess();
        }
      }
    },
  });

  return (
    <Modal title={isEdit ? t("Edit product") : t("Create product")} isOpen={isOpen} onClose={onClose}>
      <Forms.Form form={form}>
        <Forms.FieldGroup layout="vertical">
          <Forms.TextInput label={t("Display Name")} field="displayName" required autoFocus />
          {isEdit ? (
            <>
              <ReadOnlyField
                label={t("Plan Family")}
                value={planFamilyLabel(form.values.planFamily, planDefinitions)}
              />
              <ReadOnlyField label={t("Billing Interval")} value={billingIntervalLabel(form.values.billingInterval)} />
            </>
          ) : (
            <>
              <Forms.SelectBox
                label={t("Plan Family")}
                field="planFamily"
                options={availablePlanDefinitions.map((planDefinition) => ({
                  value: planDefinition.key,
                  label: planFamilyLabel(planDefinition.key, availablePlanDefinitions),
                }))}
                placeholder={
                  availablePlanDefinitions.length === 0 ? t("No provider-managed plans available") : undefined
                }
                required
              />
              <Forms.SelectBox
                label={t("Billing Interval")}
                field="billingInterval"
                options={[
                  { value: "monthly", label: t("Monthly") },
                  { value: "yearly", label: t("Yearly") },
                ]}
                required
              />
            </>
          )}
          <Forms.NumberInput label={t("Price (in cents)")} field="unitAmount" required />
        </Forms.FieldGroup>
        <Forms.Submit saveText={isEdit ? t("Save changes") : t("Create product")} cancelText={t("Cancel")} />
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

function planFamilyLabel(value: string, planDefinitions: AdminApi.BillingPlanDefinition[]) {
  const planDefinition = planDefinitions.find((definition) => definition.key === value);

  if (!planDefinition) return value;

  return i18n.t("{{displayName}} ({{key}})", { displayName: planDefinition.displayName, key: planDefinition.key });
}

function billingIntervalLabel(value: string) {
  return value === "yearly" ? i18n.t("Yearly") : i18n.t("Monthly");
}
