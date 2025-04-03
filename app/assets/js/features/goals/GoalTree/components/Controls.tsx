import React, { useMemo, useState } from "react";

import Forms from "@/components/Forms";
import Modal from "@/components/Modal";

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
  const {
    showActive,
    setShowActive,
    showPaused,
    setShowPaused,
    showCompleted,
    setShowCompleted,
    ownedBy,
    setOwnedBy,
    reviewedBy,
    setReviewedBy,
    density,
    setDensity,
    showGoals,
    setShowGoals,
    showProjects,
    setShowProjects,
  } = useTreeContext();

  const filters = useMemo(() => {
    const result: string[] = [];

    if (showActive) result.push("active");
    if (showPaused) result.push("paused");
    if (showCompleted) result.push("completed");

    return result;
  }, [showActive, showPaused, showCompleted]);

  const nodeType = useMemo(() => {
    if (showGoals && showProjects) return "any";
    if (showGoals) return "goal";
    if (showProjects) return "project";
    return "any";
  }, [showGoals, showProjects]);

  const form = Forms.useForm({
    fields: {
      filters,
      ownedBy: ownedBy,
      reviewedBy: reviewedBy,
      nodeType: nodeType,
      density: density,
    },
    submit: () => {
      if (form.values.filters.includes("active")) setShowActive(true);
      else setShowActive(false);

      if (form.values.filters.includes("paused")) setShowPaused(true);
      else setShowPaused(false);

      if (form.values.filters.includes("completed")) setShowCompleted(true);
      else setShowCompleted(false);

      setOwnedBy(form.values.ownedBy);
      setReviewedBy(form.values.reviewedBy);

      if (form.values.density) setDensity(form.values.density);

      if (form.values.nodeType === "any") {
        setShowGoals(true);
        setShowProjects(true);
      }

      if (form.values.nodeType === "goal") {
        setShowGoals(true);
        setShowProjects(false);
      }

      if (form.values.nodeType === "project") {
        setShowGoals(false);
        setShowProjects(true);
      }

      toggleShowOptions();
    },
  });

  return (
    <Modal title="View options" isOpen={showOptions} hideModal={toggleShowOptions} size="base">
      <Forms.Form form={form}>
        <Forms.FieldGroup layout="grid" layoutOptions={{ gridTemplateColumns: "repeat(3, auto)" }}>
          <Forms.RadioButtons
            field="nodeType"
            label="Show"
            options={[
              { label: "Goals and projects", value: "any" },
              { label: "Goals only", value: "goal" },
              { label: "Projects only", value: "project" },
            ]}
          />
          <Forms.CheckboxInput
            field="filters"
            label="Status"
            options={[
              { label: "Active", value: "active" },
              { label: "Paused", value: "paused" },
              { label: "Completed", value: "completed" },
            ]}
          />
          <Forms.RadioButtons
            field="ownedBy"
            label="Owned by"
            options={[
              { label: "Anyone", value: "anyone" },
              { label: "Me", value: "me" },
            ]}
          />
          <Forms.RadioButtons
            field="reviewedBy"
            label="Reviewed by"
            options={[
              { label: "Anyone", value: "anyone" },
              { label: "Me", value: "me" },
            ]}
          />
          <Forms.RadioButtons
            field="density"
            label="Density"
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
