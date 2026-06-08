import * as AdminApi from "@/ee/admin_api";
import * as React from "react";

import Forms from "@/components/Forms";
import Modal from "@/components/Modal";

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  product?: AdminApi.BillingProduct;
}

export function ProductModal({ isOpen, onClose, onSuccess, product }: ProductModalProps) {
  const [create] = AdminApi.useCreateBillingProduct();
  const [update] = AdminApi.useUpdateBillingProduct();
  const isEdit = product !== undefined;

  const form = Forms.useForm({
    fields: {
      displayName: product?.polarProductName ?? "",
      planFamily: product?.planFamily ?? "team",
      billingInterval: product?.billingInterval ?? "monthly",
      unitAmount: product?.priceAmount ? String(product.priceAmount) : "",
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
    <Modal title={isEdit ? "Edit product" : "Create product"} isOpen={isOpen} hideModal={onClose}>
      <Forms.Form form={form}>
        <Forms.FieldGroup layout="vertical">
          <Forms.TextInput label="Display Name" field="displayName" required autoFocus />
          {isEdit ? (
            <>
              <ReadOnlyField label="Plan Family" value={planFamilyLabel(form.values.planFamily)} />
              <ReadOnlyField label="Billing Interval" value={billingIntervalLabel(form.values.billingInterval)} />
            </>
          ) : (
            <>
              <Forms.SelectBox
                label="Plan Family"
                field="planFamily"
                options={[
                  { value: "team", label: "Team" },
                  { value: "business", label: "Business" },
                  { value: "unlimited", label: "Unlimited" },
                ]}
                required
              />
              <Forms.SelectBox
                label="Billing Interval"
                field="billingInterval"
                options={[
                  { value: "monthly", label: "Monthly" },
                  { value: "yearly", label: "Yearly" },
                ]}
                required
              />
            </>
          )}
          <Forms.NumberInput label="Price (in cents)" field="unitAmount" required />
        </Forms.FieldGroup>
        <Forms.Submit saveText={isEdit ? "Save changes" : "Create product"} cancelText="Cancel" />
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

function planFamilyLabel(value: string) {
  if (value === "business") return "Business";
  if (value === "unlimited") return "Unlimited";
  return "Team";
}

function billingIntervalLabel(value: string) {
  return value === "yearly" ? "Yearly" : "Monthly";
}
