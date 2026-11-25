import React from "react";
import { useTranslation } from "react-i18next";
import { PersonField } from "../PersonField";
import type { WorkMapV2Item } from "./filterWorkMap";
import { useAsyncSearch } from "../utils/useAsyncSearch";

export interface ReviewerEditing {
  canEdit: (id: string) => boolean;
  search: (item: WorkMapV2Item, query: string) => Promise<PersonField.Person[]>;
  save: (item: WorkMapV2Item, reviewer: PersonField.Person | null) => Promise<void>;
}

export function ReviewerField({ item, editing }: { item: WorkMapV2Item; editing: ReviewerEditing }) {
  const { t } = useTranslation();
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [saving, setSaving] = React.useState(false);
  const { search } = editing;
  const searchPeople = React.useCallback(({ query }: { query: string }) => search(item, query), [item, search]);
  const people = useAsyncSearch(searchPeople, query, open);

  async function setPerson(person: PersonField.Person | null) {
    setSaving(true);
    try {
      await editing.save(item, person);
    } finally {
      setSaving(false);
    }
  }

  return (
    <PersonField
      size="small"
      showTitle={false}
      testId={`reviewer-${item.id}`}
      person={item.reviewer ? { ...item.reviewer, profileLink: item.reviewerPath ?? undefined } : null}
      picker={{
        title: t("Reviewer · {{name}}", { name: item.name }),
        placeholder: t("Find a person…"),
        removeLabel: t("Remove reviewer"),
      }}
      searchData={{ people, onSearch: async (value) => setQuery(value) }}
      emptyStateMessage={t("Assign reviewer")}
      setPerson={setPerson}
      readonly={saving}
      onOpenChange={(open) => {
        setOpen(open);
        if (!open) setQuery("");
      }}
    />
  );
}
