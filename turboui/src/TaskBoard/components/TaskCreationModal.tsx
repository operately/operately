import React, { useEffect, useState } from "react";
import { PrimaryButton, SecondaryButton } from "../../Button";
import { DateField } from "../../DateField";
import { MilestoneField } from "../../MilestoneField";
import Modal from "../../Modal";
import { PersonField } from "../../PersonField";
import { SwitchToggle } from "../../SwitchToggle";
import { TextField } from "../../TextField";
import * as Types from "../types";

interface TaskCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateTask: (task: Types.NewTaskPayload) => void;
  milestones?: Types.Milestone[];
  currentMilestoneId?: string;
  people?: Types.Person[];
  searchPeople?: (params: { query: string }) => Promise<Types.Person[]>;
  searchMilestones?: (params: { query: string }) => Promise<Types.Milestone[]>;
}

export function TaskCreationModal({
  isOpen,
  onClose,
  onCreateTask,
  milestones = [],
  currentMilestoneId,
  people = [],
  searchPeople,
  searchMilestones,
}: TaskCreationModalProps) {
  // Form state
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState<DateField.ContextualDate | null>(null);
  const [assignee, setAssignee] = useState<Types.Person | null>(null);
  const [milestone, setMilestone] = useState<Types.Milestone | null>(null);
  const [createMore, setCreateMore] = useState(false);

  const disabled = !title.trim();

  // Default search functions if not provided
  const defaultSearchPeople = async ({ query }: { query: string }) => {
    return people.filter((person) => person.fullName.toLowerCase().includes(query.toLowerCase()));
  };

  const defaultSearchMilestones = async ({ query }: { query: string }) => {
    return milestones.filter((milestone) => milestone.name.toLowerCase().includes(query.toLowerCase()));
  };

  // Update milestone when currentMilestoneId changes or modal opens
  useEffect(() => {
    if (isOpen) {
      // Handle special case for "no-milestone"
      if (currentMilestoneId === "no-milestone") {
        setMilestone(null);
      } else if (currentMilestoneId) {
        const selectedMilestone = milestones.find((m) => m.id === currentMilestoneId);
        setMilestone(selectedMilestone || null);
      } else {
        // When adding from main button, clear milestone selection
        setMilestone(null);
      }
    }
  }, [isOpen, currentMilestoneId, milestones]);

  // Reset form after task creation
  const resetForm = () => {
    setTitle("");
    setDueDate(null);
    setAssignee(null);
    // Keep the milestone selected for creating multiple tasks in same milestone
    // Keep the createMore toggle state
  };

  // Reset form when modal is closed
  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Don't submit if title or milestone is empty
    if (disabled) return;

    const newTask: Types.NewTaskPayload = {
      title: title.trim(),
      milestone: milestone,
      dueDate: dueDate || null,
      assignee: assignee?.id || null,
    };

    onCreateTask(newTask);

    if (createMore) {
      resetForm();
    } else {
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Task" size="medium">
      <form onSubmit={handleSubmit} className="space-y-6">
        <TextField
          variant="form-field"
          label="Task title"
          text={title}
          onChange={setTitle}
          placeholder="Enter task title"
          autofocus
          testId="task-title"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-content-base mb-1">Due date</label>
            <DateField
              variant="form-field"
              date={dueDate}
              onDateSelect={setDueDate}
              placeholder="Set due date"
              testId="due-date"
              calendarOnly
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-content-base mb-1">Assignee</label>
            <PersonField
              person={assignee}
              setPerson={setAssignee}
              searchPeople={searchPeople || defaultSearchPeople}
              emptyStateMessage="Select assignee"
              testId="assignee"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-content-base mb-1">Milestone</label>
          <MilestoneField
            milestone={milestone ? { ...milestone, title: milestone.name } : null}
            setMilestone={(newMilestone) => {
              if (newMilestone) {
                // Convert MilestoneField.Milestone to TaskBoard.Milestone
                const convertedMilestone: Types.Milestone = {
                  ...newMilestone,
                  name: newMilestone.name || newMilestone.title || "",
                  status: "pending",
                };
                setMilestone(convertedMilestone);
              } else {
                setMilestone(null);
              }
            }}
            searchMilestones={searchMilestones || defaultSearchMilestones}
            emptyStateMessage="Select milestone"
          />
        </div>

        <div className="flex items-center mt-8">
          <SwitchToggle value={createMore} setValue={setCreateMore} label="Create more" />
          <div className="flex-1"></div>
          <div className="flex space-x-3">
            <SecondaryButton onClick={onClose} type="button">
              Cancel
            </SecondaryButton>
            <PrimaryButton type="submit" disabled={disabled}>
              Create task
            </PrimaryButton>
          </div>
        </div>
      </form>
    </Modal>
  );
}

export default TaskCreationModal;
