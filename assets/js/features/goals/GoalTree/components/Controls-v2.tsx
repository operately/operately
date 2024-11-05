import React, { useMemo, useState } from "react";

import Forms from "@/components/Forms";
import Modal from "@/components/Modal";

import { useMe } from "@/contexts/CurrentCompanyContext";
import { GhostButton } from "@/components/Buttons";

import { useExpandable } from "../context/Expandable";
import { useTreeContext } from "../treeContext";

export function Controls() {
  const { expanded, expandAll, collapseAll } = useExpandable();
  const isExpanded = Object.values(expanded).some((value) => value);
  const [showOptions, setShowOptions] = useState(false);

  const toggleShowOptions = () => setShowOptions((prev) => !prev);

  return (
    <>
      <div className="flex mb-4 items-center gap-2">
        <GhostButton onClick={isExpanded ? collapseAll : expandAll} size="sm" testId="collapse-expand-all">
          {isExpanded ? "Collapse All" : "Expand all"}
        </GhostButton>
        <GhostButton onClick={toggleShowOptions} size="sm" testId="view-options">
          View options
        </GhostButton>
      </div>

      <OptionsModal showOptions={showOptions} toggleShowOptions={toggleShowOptions} />
    </>
  );
}

function OptionsModal({ showOptions, toggleShowOptions }) {
  const me = useMe()!;
  const {
    showActive,
    setShowActive,
    showPaused,
    setShowPaused,
    showCompleted,
    setShowCompleted,
    setChampionedBy,
    setReviewedBy,
  } = useTreeContext();

  const filters = useMemo(() => {
    const result: string[] = [];

    if (showActive) result.push("active");
    if (showPaused) result.push("paused");
    if (showCompleted) result.push("completed");

    return result;
  }, [showActive, showPaused, showCompleted]);

  const form = Forms.useForm({
    fields: {
      filters,
      ownedBy: "anyone",
      reviewedBy: "anyone",
    },
    submit: () => {
      if (form.values.filters.includes("active")) setShowActive(true);
      else setShowActive(false);

      if (form.values.filters.includes("paused")) setShowPaused(true);
      else setShowPaused(false);

      if (form.values.filters.includes("completed")) setShowCompleted(true);
      else setShowCompleted(false);

      if (form.values.ownedBy === "me") setChampionedBy(me);
      else setChampionedBy(undefined);

      if (form.values.reviewedBy === "me") setReviewedBy(me);
      else setReviewedBy(undefined);

      toggleShowOptions();
    },
  });

  return (
    <Modal title="View options" isOpen={showOptions} hideModal={toggleShowOptions} size="lg">
      <Forms.Form form={form}>
        <Forms.FieldGroup layout="grid" layoutOptions={{ gridTemplateColumns: "repeat(3, auto)" }}>
          <Forms.CheckboxInput
            field="filters"
            label="Show goals and projects:"
            options={[
              { label: "Active", value: "active" },
              { label: "Paused", value: "paused" },
              { label: "Completed", value: "completed" },
            ]}
          />
          <Forms.RadioButtons
            field="ownedBy"
            label="Owned by:"
            options={[
              { label: "Anyone", value: "anyone" },
              { label: "Me", value: "me" },
            ]}
          />
          <Forms.RadioButtons
            field="reviewedBy"
            label="Reviewed by:"
            options={[
              { label: "Anyone", value: "anyone" },
              { label: "Me", value: "me" },
            ]}
          />
        </Forms.FieldGroup>

        <Forms.Submit />
      </Forms.Form>
    </Modal>
  );
}
