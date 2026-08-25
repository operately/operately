import React from "react";

import { Form, SelectBox, SelectPerson, Submit, TextInput, useForm } from "../Forms";
import { Modal } from "../Modal";
import type { SpaceKpisPage } from "./types";
import { CADENCE_OPTIONS } from "./utils";

interface NewKpiModalProps {
  isOpen: boolean;
  onClose: () => void;
  championSearch: (query: string) => Promise<SpaceKpisPage.Person[]>;
  onCreate: (input: SpaceKpisPage.NewKpiInput) => Promise<SpaceKpisPage.MutationResult>;
}

// New KPI form → calls the `createKpi` mutation via the onCreate callback.
// Mirrors the goal add form: presentational form, no direct data access. There
// is no edit mode: an existing KPI's fields are edited in place on its own page.
export function NewKpiModal({ isOpen, onClose, championSearch, onCreate }: NewKpiModalProps) {
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
      name: "",
      unit: "",
      cadence: "monthly",
      championId: null,
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

      const result = await onCreate({
        name: form.values.name.trim(),
        unit: form.values.unit.trim(),
        cadence: form.values.cadence as SpaceKpisPage.Cadence,
        championId: form.values.championId,
      });

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
    <Modal isOpen={isOpen} onClose={onClose} title="New KPI" size="small" testId="new-kpi-modal">
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
            allowEmpty
            emptyLabel="No champion"
            required={false}
            portalMenu
          />
        </div>

        {submitError && (
          <div className="mt-4 text-sm text-content-error" data-test-id="kpi-form-error">
            {submitError}
          </div>
        )}

        <Submit saveText="Create KPI" cancelText="Cancel" />
      </Form>
    </Modal>
  );
}
