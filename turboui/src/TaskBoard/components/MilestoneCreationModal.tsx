import React, { useState, useEffect, useRef } from "react";
import { PrimaryButton, SecondaryButton } from "../../Button";
import * as Types from "../types";
import Modal from "../../Modal";
import { DateField } from "../../DateField";
import { SwitchToggle } from "../../SwitchToggle";
import { TextField } from "../../TextField";

interface MilestoneCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateMilestone: (milestone: Types.NewMilestonePayload) => void;
}

export function MilestoneCreationModal({
  isOpen,
  onClose,
  onCreateMilestone,
}: MilestoneCreationModalProps) {
  // Form state
  const [name, setName] = useState("");
  const [dueDate, setDueDate] = useState<DateField.ContextualDate | null>(null);
  const [createMore, setCreateMore] = useState(false);

  const nameInputRef = useRef<HTMLInputElement | null>(null);

  // Reset form after milestone creation
  const resetForm = () => {
    setName("");
    setDueDate(null);
    // Keep the createMore toggle state
  };

  // Focus name input when modal opens
  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => {
        nameInputRef.current?.focus();
        nameInputRef.current?.select();
      });
    } else if (!isOpen) {
      // Reset the form when the modal is closed
      resetForm();
    }
  }, [isOpen]);

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Don't submit if name is empty
    if (!name.trim()) return;

    // Create new milestone object
    const newMilestone: Types.NewMilestonePayload = {
      name: name.trim(),
      hasDescription: false,
      hasComments: false,
      status: "pending",
      dueDate,
      kanbanLink: "",
    };

    // Submit the milestone
    onCreateMilestone(newMilestone);

    // Handle form after submission
    if (createMore) {
      resetForm();
      // Focus name input again
      requestAnimationFrame(() => {
        nameInputRef.current?.focus();
        nameInputRef.current?.select();
      });
    } else {
      onClose();
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Milestone"
      size="medium"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <TextField
          variant="form-field"
          label="Milestone name"
          text={name}
          onChange={setName}
          placeholder="Enter milestone name"
          testId="milestone-name"
          autofocus
          inputRef={nameInputRef}
        />

        <div>
          <label className="block text-sm font-medium text-content-base mb-1">Due date</label>
          <DateField
            variant="form-field"
            date={dueDate}
            onDateSelect={setDueDate}
            placeholder="Set due date"
            calendarOnly
            testId="milestone-due-date"
          />
        </div>

        <div className="flex items-center mt-4 gap-4">
          <SwitchToggle value={createMore} setValue={setCreateMore} label="Create more" testId="add-more-switch" />
          <div className="flex-1" />
          <div className="flex gap-3">
            <SecondaryButton onClick={onClose} type="button">
              Cancel
            </SecondaryButton>
            <PrimaryButton type="submit" disabled={!name.trim()}>
              Create milestone
            </PrimaryButton>
          </div>
        </div>
      </form>
    </Modal>
  );
}

export default MilestoneCreationModal;
