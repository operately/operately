import * as AdminApi from "@/ee/admin_api";
import * as React from "react";

import Forms from "@/components/Forms";
import Modal from "@/components/Modal";

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product?: AdminApi.BillingProduct;
}

export function ProductModal({ isOpen, onClose, product }: ProductModalProps) {
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
          planFamily: form.values.planFamily,
          billingInterval: form.values.billingInterval,
          priceAmount: parseInt(form.values.unitAmount, 10),
          priceCurrency: "usd",
        });

        if (result && result.product) {
          onClose();
          window.location.reload();
        }
      } else {
        const result = await create({
          provider: "polar",
          planFamily: form.values.planFamily,
          billingInterval: form.values.billingInterval,
          polarProductId: "",
          polarProductName: form.values.displayName,
          priceAmount: parseInt(form.values.unitAmount, 10),
          priceCurrency: "usd",
        });

        if (result && result.success) {
          onClose();
          window.location.reload();
        }
      }
    },
  });

  return (
    <Modal title={isEdit ? "Edit Product" : "Create Product"} isOpen={isOpen} hideModal={onClose}>
      <Forms.Form form={form}>
        <Forms.FieldGroup layout="vertical">
          <Forms.TextInput label="Display Name" field="displayName" required autoFocus />
          <Forms.SelectBox
            label="Plan Family"
            field="planFamily"
            options={[
              { value: "team", label: "Team" },
              { value: "business", label: "Business" },
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
          <Forms.NumberInput label="Price (in cents)" field="unitAmount" required />
        </Forms.FieldGroup>
        <Forms.Submit saveText={isEdit ? "Save Changes" : "Create Product"} cancelText="Cancel" />
      </Forms.Form>
    </Modal>
  );
}
