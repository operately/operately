import * as AdminApi from "@/ee/admin_api";
import * as React from "react";

import { useRichEditorHandlers } from "@/hooks/useRichEditorHandlers";
import * as People from "@/models/people";
import classNames from "classnames";
import { emptyContent, Forms, IconSearch, IconX, Modal, parseContent } from "turboui";

const SEARCH_DEBOUNCE_MS = 250;

interface SiteMessageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  message?: AdminApi.SiteMessage;
}

export function SiteMessageModal({ isOpen, onClose, onSuccess, message }: SiteMessageModalProps) {
  const [create] = AdminApi.useCreateSiteMessage();
  const [update] = AdminApi.useUpdateSiteMessage();
  const isEdit = message !== undefined;
  const richTextHandlers = useRichEditorHandlers({ scope: People.NoneSearchScope });

  const form = Forms.useForm({
    fields: {
      title: message?.title ?? "",
      description: message?.description ? parseContent(message.description) : emptyContent(),
      audience: message?.allCompanies ? "all" : "specific",
      active: message?.active === false ? "false" : "true",
      expiresAt: dateInputFromExpiresAt(message?.expiresAt),
      companyIds: message?.companyIds ?? [],
    },
    cancel: onClose,
    submit: async () => {
      const payload = {
        title: form.values.title,
        description: JSON.stringify(form.values.description),
        allCompanies: form.values.audience === "all",
        active: form.values.active === "true",
        expiresAt: expiresAtFromDateInput(form.values.expiresAt),
        companyIds: form.values.audience === "all" ? [] : form.values.companyIds,
      };

      const result = isEdit
        ? await update({
            id: message.id,
            ...payload,
          })
        : await create(payload);

      if (result?.message) {
        form.actions.reset();
        onClose();
        onSuccess();
      }
    },
  });

  return (
    <Modal title={isEdit ? "Edit message" : "Create message"} isOpen={isOpen} onClose={onClose} size="large">
      <Forms.Form form={form}>
        <Forms.FieldGroup>
          <Forms.TextInput field="title" label="Title" required autoFocus />
          <Forms.RichTextArea
            field="description"
            label="Description"
            required
            richTextHandlers={richTextHandlers}
          />

          <Forms.SelectBox
            field="audience"
            label="Audience"
            options={[
              { value: "all", label: "All companies" },
              { value: "specific", label: "Specific companies" },
            ]}
            required
          />

          {form.values.audience === "specific" ? (
            <CompanyPicker
              selectedCompanyIds={form.values.companyIds}
              onChange={(companyIds) => form.actions.setValue("companyIds", companyIds)}
              error={form.errors.companyIds}
            />
          ) : null}

          <Forms.SelectBox
            field="active"
            label="Status"
            options={[
              { value: "true", label: "Active" },
              { value: "false", label: "Inactive" },
            ]}
            required
          />

          <Forms.TextInput field="expiresAt" label="Expires on" placeholder="YYYY-MM-DD" />
          <div className="text-xs text-content-subtle">Optional. Leave blank to show until deactivated or deleted.</div>
        </Forms.FieldGroup>

        <Forms.Submit saveText={isEdit ? "Save changes" : "Create message"} cancelText="Cancel" />
      </Forms.Form>
    </Modal>
  );
}

function CompanyPicker({
  selectedCompanyIds,
  onChange,
  error,
}: {
  selectedCompanyIds: string[];
  onChange: (companyIds: string[]) => void;
  error?: string;
}) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const debouncedSearchQuery = useDebouncedValue(searchQuery, SEARCH_DEBOUNCE_MS);
  const { data, loading, error: loadError } = AdminApi.useGetCompanies({});

  const companies = data?.companies ?? [];
  const filteredCompanies = filterCompanies(companies, debouncedSearchQuery);
  const selectedCompanies = companies.filter((company) => company.id && selectedCompanyIds.includes(company.id));

  const toggleCompany = (companyId: string) => {
    if (selectedCompanyIds.includes(companyId)) {
      onChange(selectedCompanyIds.filter((id) => id !== companyId));
    } else {
      onChange([...selectedCompanyIds, companyId]);
    }
  };

  return (
    <Forms.InputField field="companyIds" label="Companies" error={error}>
      <div className="space-y-3">
        {selectedCompanies.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {selectedCompanies.map((company) => (
              <button
                key={company.id}
                type="button"
                className="inline-flex items-center gap-1 rounded-full border border-surface-outline bg-surface-dimmed px-3 py-1 text-sm text-content-base"
                onClick={() => toggleCompany(company.id!)}
              >
                <span>{company.name}</span>
                <IconX size={14} />
              </button>
            ))}
          </div>
        ) : (
          <div className="text-sm text-content-subtle">No companies selected yet.</div>
        )}

        <div className="flex items-center gap-2 rounded-lg border border-surface-outline px-3 py-2">
          <IconSearch size={16} className="shrink-0 text-content-dimmed" />
          <input
            type="text"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search companies"
            className="min-w-0 flex-1 bg-transparent text-sm outline-none"
            data-test-id="site-message-company-search"
          />
        </div>

        <div className="max-h-48 overflow-y-auto rounded-lg border border-surface-outline">
          {loading ? <div className="px-3 py-2 text-sm text-content-subtle">Loading companies...</div> : null}
          {loadError ? <div className="px-3 py-2 text-sm text-red-500">Failed to load companies</div> : null}
          {!loading && filteredCompanies.length === 0 ? (
            <div className="px-3 py-2 text-sm text-content-subtle">No companies match your search.</div>
          ) : null}
          {filteredCompanies.map((company) => {
            const selected = company.id ? selectedCompanyIds.includes(company.id) : false;

            return (
              <button
                key={company.id}
                type="button"
                className={classNames(
                  "flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-surface-highlight",
                  selected && "bg-surface-dimmed",
                )}
                onClick={() => company.id && toggleCompany(company.id)}
              >
                <span>{company.name}</span>
                {selected ? <span className="text-xs text-content-subtle">Selected</span> : null}
              </button>
            );
          })}
        </div>
      </div>
    </Forms.InputField>
  );
}

function filterCompanies(companies: AdminApi.Company[], searchQuery: string) {
  const normalized = searchQuery.trim().toLowerCase();
  if (!normalized) return companies;

  return companies.filter((company) => company.name?.toLowerCase().includes(normalized));
}

function dateInputFromExpiresAt(expiresAt?: string | null) {
  if (!expiresAt) return "";
  return expiresAt.slice(0, 10);
}

function expiresAtFromDateInput(date: string) {
  if (!date.trim()) return undefined;
  return new Date(`${date}T23:59:59.000Z`).toISOString();
}

function useDebouncedValue<T>(value: T, delay: number) {
  const [debouncedValue, setDebouncedValue] = React.useState(value);

  React.useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedValue(value), delay);
    return () => window.clearTimeout(timeout);
  }, [value, delay]);

  return debouncedValue;
}
