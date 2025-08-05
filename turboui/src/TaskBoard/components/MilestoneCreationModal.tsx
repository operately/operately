import React, { useState, useEffect, useRef } from "react";
import { PrimaryButton, SecondaryButton } from "../../Button";
import * as Types from "../types";
import Modal from "../../Modal";
import { IconCalendar } from "../../icons";

interface MilestoneCreationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateMilestone: (milestone: Omit<Types.Milestone, "id">) => void;
}

export function MilestoneCreationModal({
  isOpen,
  onClose,
  onCreateMilestone,
}: MilestoneCreationModalProps) {
  // Form state
  const [name, setName] = useState("");
  const [dueDate, setDueDate] = useState<string>("");
  const [createMore, setCreateMore] = useState(false);
  
  // Refs
  const nameInputRef = useRef<HTMLInputElement>(null);
  
  // Reset form after milestone creation
  const resetForm = () => {
    setName("");
    setDueDate("");
    // Keep the createMore toggle state
  };
  
  // Focus name input when modal opens
  useEffect(() => {
    if (isOpen && nameInputRef.current) {
      setTimeout(() => {
        nameInputRef.current?.focus();
      }, 100);
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
    const newMilestone: Omit<Types.Milestone, "id"> = {
      name: name.trim(),
      hasDescription: false,
      hasComments: false,
      status: "pending",
    };
    
    // Add optional fields if they exist
    if (dueDate) {
      newMilestone.dueDate = {
        date: new Date(dueDate),
        dateType: "day",
        value: dueDate,
      };
    }
    
    // Submit the milestone
    onCreateMilestone(newMilestone);
    
    // Handle form after submission
    if (createMore) {
      resetForm();
      // Focus name input again
      setTimeout(() => {
        nameInputRef.current?.focus();
      }, 100);
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
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="milestone-name" className="block text-sm font-medium text-content-base mb-1">
            Milestone name
          </label>
          <input
            id="milestone-name"
            ref={nameInputRef}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter milestone name"
            className="w-full px-3 py-2 border border-surface-outline rounded-md focus:outline-none focus:ring-2 focus:ring-primary-base"
            required
            autoFocus
          />
        </div>
        
        <div>
          <label htmlFor="due-date" className="block text-sm font-medium text-content-base mb-1">
            Due date
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <IconCalendar size={16} className="text-content-subtle" />
            </div>
            <input
              id="due-date"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-surface-outline rounded-md focus:outline-none focus:ring-2 focus:ring-primary-base"
            />
          </div>
        </div>
        
        <div className="flex items-center mt-4">
          <input
            id="create-more"
            type="checkbox"
            checked={createMore}
            onChange={(e) => setCreateMore(e.target.checked)}
            className="h-4 w-4 text-primary-base border-surface-outline rounded focus:ring-primary-base"
          />
          <label htmlFor="create-more" className="ml-2 block text-sm text-content-base">
            Create another milestone after this one
          </label>
        </div>
        
        <div className="flex justify-end space-x-2 pt-2">
          <SecondaryButton onClick={onClose} type="button">
            Cancel
          </SecondaryButton>
          <PrimaryButton type="submit" disabled={!name.trim()}>
            Create Milestone
          </PrimaryButton>
        </div>
      </form>
    </Modal>
  );
}

export default MilestoneCreationModal;
