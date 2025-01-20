import React, { useMemo, useState } from "react";

import Forms from "@/components/Forms";
import Modal from "@/components/Modal";

import { useMe } from "@/contexts/CurrentCompanyContext";
import { SecondaryButton } from "@/components/Buttons";

import { useExpandable } from "../context/Expandable";
import { useTreeContext } from "../treeContext";
import { TimeframeSelector } from "@/components/TimeframeSelector";

export function Controls() {
  const { tree } = useTreeContext();
  const { expanded, expandAll, collapseAll } = useExpandable();
  const { timeframe, setTimeframe } = useTreeContext();

  const rootGoals = tree.filter((node) => node.type === "goal");

  const isExpanded = rootGoals.some((goal) => expanded[goal.id]);
  const [showOptions, setShowOptions] = useState(false);

  const toggleShowOptions = () => setShowOptions((prev) => !prev);

  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <SecondaryButton onClick={isExpanded ? collapseAll : expandAll} size="xs" testId="collapse-expand-all">
          {isExpanded ? "Collapse All" : "Expand all"}
        </SecondaryButton>

        <SecondaryButton onClick={toggleShowOptions} size="xs" testId="view-options">
          View options
        </SecondaryButton>
      </div>

      <div className="flex items-center gap-2">
        <TimeframeSelector timeframe={timeframe} setTimeframe={setTimeframe} size="xs" alignContent="end" />
      </div>

      <OptionsModal showOptions={showOptions} toggleShowOptions={toggleShowOptions} />
    </div>
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
    density,
    setDensity,
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
      density: density,
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

      if (form.values.density) setDensity(form.values.density);

      toggleShowOptions();
    },
  });

  return (
    <Modal title="View options" isOpen={showOptions} hideModal={toggleShowOptions} size="base">
      <Forms.Form form={form}>
        <Forms.FieldGroup layout="grid" layoutOptions={{ gridTemplateColumns: "repeat(2, auto)" }}>
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
          <Forms.RadioButtons
            field="density"
            label="Density:"
            options={[
              { label: "Default", value: "default" },
              { label: "Compact", value: "compact" },
            ]}
          />
        </Forms.FieldGroup>

        <Forms.Submit />
      </Forms.Form>
    </Modal>
  );
}
