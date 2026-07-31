import React from "react";

import { Form, SelectBox, SelectPerson, Submit, TextInput, useForm } from "../Forms";
import { Modal } from "../Modal";
import type { SpaceKpisPage } from "./types";

interface KpiFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  championSearch: (query: string) => Promise<SpaceKpisPage.Person[]>;

  // When `kpi` is provided the modal edits it (calls onEdit); otherwise it
  // creates a new KPI (calls onCreate). Only one of the callbacks is used per
  // mode, keeping the shared form free of mode-specific branching at the caller.
  kpi?: SpaceKpisPage.Kpi | null;
  onCreate: (input: SpaceKpisPage.NewKpiInput) => Promise<SpaceKpisPage.MutationResult>;
  onEdit: (input: SpaceKpisPage.EditKpiInput) => Promise<SpaceKpisPage.MutationResult>;
}

const CADENCE_OPTIONS = [
  { label: "Weekly", value: "weekly" },
  { label: "Monthly", value: "monthly" },
];

// Create/Edit KPI form → calls the `createKpi` / `updateKpi` mutation via the
// onCreate / onEdit callbacks. Mirrors the goal add form: presentational form,
// no direct data access.
//
// The modal is remounted (via a `key` at the call site) whenever the edited KPI
// changes so `useForm`'s one-shot initial values pick up the right defaults.
export function KpiFormModal({ isOpen, onClose, championSearch, kpi, onCreate, onEdit }: KpiFormModalProps) {
  const isEditing = Boolean(kpi);
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  const searchFn = React.useCallback(
    async (query: string) => {
      const people = await championSearch(query);
      return people.map((p) => ({ id: p.id, fullName: p.fullName, avatarUrl: p.avatarUrl, title: p.title ?? null }));
    },
    [championSearch],
  );

  const form = useForm<{ name: string; unit: string; cadence: string; championId: string | null }>({
    fields: {
      name: kpi?.name ?? "",
      unit: kpi?.unit ?? "",
      cadence: kpi?.cadence ?? "monthly",
      championId: kpi?.champion?.id ?? null,
    },
    validate: (addError) => {
      if (!form.values.name.trim()) addError("name", "Name is required");
      if (!form.values.unit.trim()) addError("unit", "Unit is required");
      if (form.values.cadence !== "weekly" && form.values.cadence !== "monthly") {
        addError("cadence", "Choose a cadence");
      }
    },
    submit: async () => {
      setSubmitError(null);

      const shared = {
        name: form.values.name.trim(),
        unit: form.values.unit.trim(),
        cadence: form.values.cadence as SpaceKpisPage.Cadence,
        championId: form.values.championId,
      };

      const result = kpi ? await onEdit({ id: kpi.id, ...shared }) : await onCreate(shared);

      if (result.success) {
        form.actions.reset();
        onClose();
      } else {
        setSubmitError(result.error ?? "Something went wrong. Please try again.");
      }
    },
    cancel: onClose,
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? "Edit KPI" : "New KPI"}
      size="small"
      testId={isEditing ? "edit-kpi-modal" : "new-kpi-modal"}
    >
      <Form form={form}>
        <div className="space-y-4">
          <TextInput field="name" label="Name" placeholder="e.g. Monthly Recurring Revenue" required autoFocus />
          <div className="grid grid-cols-2 gap-4">
            <TextInput field="unit" label="Unit" placeholder="e.g. USD, %, users" required />
            <SelectBox field="cadence" label="Cadence" options={CADENCE_OPTIONS} />
          </div>
          <SelectPerson
            field="championId"
            label="Champion"
            searchFn={searchFn}
            default={kpi?.champion ?? undefined}
            allowEmpty
            emptyLabel="No champion"
            required={false}
          />
        </div>

        {submitError && (
          <div className="mt-4 text-sm text-content-error" data-test-id="kpi-form-error">
            {submitError}
          </div>
        )}

        <Submit saveText={isEditing ? "Save changes" : "Create KPI"} cancelText="Cancel" />
      </Form>
    </Modal>
  );
}
