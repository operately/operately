import React, { useMemo, useState } from "react";
import { SlideIn } from "../../SlideIn";
import { Task, Milestone } from "../types";
import { DateField } from "../../DateField";
import { PersonField } from "../../PersonField";
import { MilestoneField } from "../../MilestoneField";
import { StatusSelector } from "../../StatusSelector";
import RichContent from "../../RichContent";
import { IconX } from "../../icons";
import { BlackLink } from "../../Link";

interface TaskSlideInProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  onAssigneeChange?: (taskId: string, assignee: any) => void;
  onDueDateChange?: (taskId: string, dueDate: any) => void;
  onMilestoneChange: (taskId: string, milestone: Milestone | null) => void;
  onNameChange?: (taskId: string, name: string) => void;
  onStatusChange?: (taskId: string, status: any) => void;
  assigneePersonSearch?: any;
  statuses: StatusSelector.StatusOption[];
  milestones?: Milestone[];
  onMilestoneSearch?: (query: string) => Promise<void>;
}

export function TaskSlideIn({
  isOpen,
  onClose,
  task,
  onAssigneeChange,
  onDueDateChange,
  onMilestoneChange,
  onNameChange,
  onStatusChange,
  assigneePersonSearch,
  statuses,
  milestones = [],
  onMilestoneSearch,
}: TaskSlideInProps) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState("");
  const descriptionContent = useMemo(() => {
    if (!task?.description) return null;
    try {
      return JSON.parse(task.description);
    } catch (e) {
      return null;
    }
  }, [task?.description]);

  if (!task) return null;

  return (
    <SlideIn
      isOpen={isOpen}
      onClose={onClose}
      width="600px"
      testId="task-slide-in"
      header={
        <>
          <button
            onClick={onClose}
            className="absolute top-3 right-3 text-content-dimmed hover:text-content-base rounded-full hover:bg-surface-highlight transition-colors"
            title="Close"
          >
            <IconX size={20} />
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-8 px-6 py-6">
        {/* Title */}
        <div className="w-full border-b border-surface-outline pb-4">
          {isEditingName ? (
            <input
              type="text"
              value={editedName}
              onChange={(e) => setEditedName(e.target.value)}
              onBlur={() => {
                if (editedName.trim() && editedName !== task.title) {
                  onNameChange?.(task.id, editedName.trim());
                }
                setIsEditingName(false);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  if (editedName.trim() && editedName !== task.title) {
                    onNameChange?.(task.id, editedName.trim());
                  }
                  setIsEditingName(false);
                } else if (e.key === "Escape") {
                  setIsEditingName(false);
                }
              }}
              autoFocus
              className="w-full text-2xl font-bold text-content-accent leading-tight bg-transparent border-none outline-none focus:ring-0"
            />
          ) : (
            <div
              onClick={() => {
                if (onNameChange) {
                  setEditedName(task.title);
                  setIsEditingName(true);
                }
              }}
              className={onNameChange ? "cursor-text" : ""}
            >
              <BlackLink to={task.link} underline="hover" className="text-2xl font-bold text-content-accent leading-tight">
                {task.title}
              </BlackLink>
            </div>
          )}
        </div>

        {/* Fields Grid */}
        <div className="grid grid-cols-2 gap-x-8 gap-y-6">
          <Field label="Status">
            <StatusSelector
              status={task.status ?? statuses[0]!}
              statusOptions={statuses}
              onChange={(newStatus) => onStatusChange?.(task.id, newStatus)}
              readonly={!onStatusChange}
              size="sm"
              showFullBadge={true}
            />
          </Field>

          <Field label="Assignee">
            <PersonField
              person={task.assignees?.[0] || null}
              setPerson={(p) => onAssigneeChange?.(task.id, p)}
              searchData={assigneePersonSearch}
              readonly={!onAssigneeChange}
            />
          </Field>

          <Field label="Due Date">
            <DateField
              date={task.dueDate}
              onDateSelect={(d) => onDueDateChange?.(task.id, d)}
              showOverdueWarning={!task.status?.closed}
              readonly={!onDueDateChange}
            />
          </Field>

          <Field label="Milestone">
            <MilestoneField
              milestone={task.milestone}
              setMilestone={(m) => onMilestoneChange?.(task.id, m as Milestone | null)}
              readonly={!onMilestoneChange}
              milestones={milestones}
              onSearch={onMilestoneSearch ?? (async () => {})}
            />
          </Field>
        </div>

        {/* Description */}
        <div className="flex flex-col gap-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-content-dimmed">Description</h3>
          <div className="text-sm text-content-base leading-relaxed">
            {descriptionContent ? (
              <RichContent content={descriptionContent} mentionedPersonLookup={async () => null} />
            ) : (
              <span className="text-content-subtle italic">No description provided.</span>
            )}
          </div>
        </div>
      </div>
    </SlideIn>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold text-content-dimmed uppercase tracking-wider">{label}</label>
      <div className="min-h-[32px] flex items-center">{children}</div>
    </div>
  );
}
